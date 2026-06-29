"use client";

import { useState, useRef, useEffect } from "react";

type Recipient = {
  id: string;
  label: string;
  role: "Teacher" | "Parent" | "Admin" | "Student";
};

type Message = {
  id: number;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  senderName: string;
};

type Props = {
  messages: Message[];
  recipients: Recipient[];
  currentUserId: string;
  sendMessage: (formData: FormData) => Promise<void>;
};

const roleBadgeStyles: Record<Recipient["role"], string> = {
  Teacher: "bg-blue-100 text-blue-700",
  Parent:  "bg-green-100 text-green-700",
  Admin:   "bg-purple-100 text-purple-700",
  Student: "bg-orange-100 text-orange-700",
};

const roleAvatarStyles: Record<Recipient["role"], string> = {
  Teacher: "bg-blue-500",
  Parent:  "bg-green-500",
  Admin:   "bg-purple-500",
  Student: "bg-orange-500",
};

export default function MessageClient({ messages, recipients, currentUserId, sendMessage }: Props) {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Build a map of all people we've talked to or can talk to
  const allPeople = new Map<string, { label: string; role: Recipient["role"] }>();
  recipients.forEach((r) => allPeople.set(r.id, { label: r.label, role: r.role }));

  // Collect unique conversation partners from message history
  const conversationPartnerIds = [...new Set(
    messages.map((m) => m.senderId === currentUserId ? m.receiverId : m.senderId)
  )];

  // Build conversation list: partners we've messaged + all recipients (for new chats)
  const conversations = conversationPartnerIds.map((pid) => {
    const person = allPeople.get(pid);
    const threadMessages = messages.filter(
      (m) => (m.senderId === pid && m.receiverId === currentUserId) ||
              (m.senderId === currentUserId && m.receiverId === pid)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const lastMsg = threadMessages[0];
    const unread = threadMessages.filter((m) => m.senderId === pid).length;

    return {
      id: pid,
      label: person?.label ?? lastMsg?.senderName ?? "Unknown",
      role: person?.role ?? ("Student" as Recipient["role"]),
      lastMessage: lastMsg?.content ?? "",
      lastTime: lastMsg?.createdAt,
      unread,
    };
  }).sort((a, b) => new Date(b.lastTime ?? 0).getTime() - new Date(a.lastTime ?? 0).getTime());

  // Active thread messages
  const activeThread = activeChatId
    ? messages
        .filter(
          (m) =>
            (m.senderId === activeChatId && m.receiverId === currentUserId) ||
            (m.senderId === currentUserId && m.receiverId === activeChatId)
        )
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  const activePerson = activeChatId ? allPeople.get(activeChatId) : null;

  const filteredConversations = conversations.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRecipients = recipients.filter(
    (r) =>
      r.label.toLowerCase().includes(dropdownSearch.toLowerCase()) ||
      r.role.toLowerCase().includes(dropdownSearch.toLowerCase())
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeChatId || !content.trim() || sending) return;
    setSending(true);
    const fd = new FormData();
    fd.append("receiverId", activeChatId);
    fd.append("content", content);
    await sendMessage(fd);
    setContent("");
    setSending(false);
  }

  function getInitials(label: string) {
    return label.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">

      {/* ── LEFT SIDEBAR ── */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">

        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-800">Messages</h1>
            <button
              onClick={() => setShowNewChat(true)}
              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition text-lg font-light"
              title="New message"
            >
              +
            </button>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full text-sm px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              No conversations yet.<br />
              <button onClick={() => setShowNewChat(true)} className="text-blue-500 mt-1 hover:underline">
                Start one
              </button>
            </div>
          ) : (
            filteredConversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveChatId(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-50 ${
                  activeChatId === c.id ? "bg-blue-50 border-l-2 border-l-blue-500" : ""
                }`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold ${roleAvatarStyles[c.role]}`}>
                  {getInitials(c.label)}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800 truncate">{c.label}</span>
                    {c.lastTime && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                        {new Date(c.lastTime).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleBadgeStyles[c.role]}`}>
                      {c.role}
                    </span>
                    <span className="text-xs text-gray-400 truncate">{c.lastMessage}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT CHAT AREA ── */}
      <div className="flex-1 flex flex-col">
        {activeChatId ? (
          <>
            {/* Chat Header */}
            <div className="px-5 py-3 bg-white border-b border-gray-100 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold ${roleAvatarStyles[activePerson?.role ?? "Student"]}`}>
                {getInitials(activePerson?.label ?? "?")}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{activePerson?.label ?? "Unknown"}</p>
                <p className="text-xs text-gray-400">{activePerson?.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {activeThread.map((msg) => {
                const isSent = msg.senderId === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                      isSent
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-gray-700 rounded-bl-sm shadow-sm"
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${isSent ? "text-blue-200" : "text-gray-400"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="px-5 py-3 bg-white border-t border-gray-100 flex gap-2 items-end">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as any); }
                }}
                placeholder="Write a message… (Enter to send)"
                rows={1}
                className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y min-h-[42px] max-h-32"
              />
              <button
                type="submit"
                disabled={!content.trim() || sending}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition flex-shrink-0"
              >
                {sending ? "…" : "Send"}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl">✉</div>
            <p className="text-sm font-medium text-gray-500">Select a conversation</p>
            <p className="text-xs">or start a new one with the + button</p>
          </div>
        )}
      </div>

      {/* ── NEW CHAT MODAL ── */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowNewChat(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-96 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">New Message</h2>
              <button onClick={() => setShowNewChat(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="p-3 border-b border-gray-100">
              <input
                autoFocus
                value={dropdownSearch}
                onChange={(e) => setDropdownSearch(e.target.value)}
                placeholder="Search by name or role…"
                className="w-full text-sm px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
              {filteredRecipients.length === 0 ? (
                <li className="px-4 py-4 text-sm text-gray-400 text-center">No recipients found</li>
              ) : (
                filteredRecipients.map((r) => (
                  <li
                    key={r.id}
                    onClick={() => {
                      setActiveChatId(r.id);
                      setShowNewChat(false);
                      setDropdownSearch("");
                    }}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50 transition"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${roleAvatarStyles[r.role]}`}>
                      {getInitials(r.label)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.label}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleBadgeStyles[r.role]}`}>{r.role}</span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}