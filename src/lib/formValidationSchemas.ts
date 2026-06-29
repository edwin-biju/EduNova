import { z } from "zod";

/* ================= SUBJECT SCHEMA ================= */
export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  teachers: z.array(z.string()), // teacher ids
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

/* ================= CLASS SCHEMA ================= */
export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Class name is required!" }), 
  capacity: z.coerce.number().min(1, { message: "Capacity is required!" }), 
  gradeId: z.coerce.number().min(1, { message: "Grade is required!" }), 
  supervisorId: z.string().optional().nullable(), 
});

export type ClassSchema = z.infer<typeof classSchema>;

/* ================= TEACHER SCHEMA ================= */
export const teacherSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string()
    .min(1, { message: "First name is required!" })
    .regex(/^[A-Za-z\s.]+$/, { message: "Name must contain only letters!" }),
  surname: z.string()
    .min(1, { message: "Last name is required!" })
    .regex(/^[A-Za-z\s.]+$/, { message: "Last name must contain only letters!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string()
    .optional()
    .nullable()
    .refine((val) => !val || /^\d{10,12}$/.test(val), {
      message: "Phone number must be between 10 to 12 valid digits!",
    }),
  
  address: z.string()
    .min(5, { message: "Please enter a descriptive address (min 5 chars)!" })
    .refine((val) => /[A-Za-z]/.test(val), {
      message: "Address must contain valid physical location text details!",
    }),

  bloodType: z.string()
    .min(1, { message: "Blood Type is required!" })
    .toUpperCase()
    .refine((val) => /^(A|B|AB|O)[+-]$/.test(val), {
      message: "Invalid blood type! Use formats like A+, B-, O+, AB+.",
    }),

  img: z.string().optional().nullable(),
  
  // ✅ LOCKED DOWN TEACHER BIRTHDAY: Must be at least 18 years old and not in the future
  birthday: z.coerce.date({ message: "Birthday is required!" })
    .refine((val) => {
      const today = new Date();
      const minAgeDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      return val <= minAgeDate;
    }, {
      message: "Teacher must be at least 18 years old!",
    })
    .refine((val) => val <= new Date(), {
      message: "Birthday cannot be a future date!",
    }),

  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  subjects: z.array(z.string()).optional(), 
});

export type TeacherSchema = z.infer<typeof teacherSchema>;

/* ================= STUDENT SCHEMA ================= */
export const studentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string()
    .min(1, { message: "First name is required!" })
    .regex(/^[A-Za-z\s.]+$/, { message: "Name must contain only letters!" }),
  surname: z.string()
    .min(1, { message: "Last name is required!" })
    .regex(/^[A-Za-z\s.]+$/, { message: "Last name must contain only letters!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string()
    .optional()
    .nullable()
    .refine((val) => !val || /^\d{10,12}$/.test(val), {
      message: "Phone number must be between 10 to 12 valid digits!",
    }),

  address: z.string()
    .min(5, { message: "Please enter a descriptive address (min 5 chars)!" })
    .refine((val) => /[A-Za-z]/.test(val), {
      message: "Address must contain valid physical location text details!",
    }),

  bloodType: z.string()
    .min(1, { message: "Blood Type is required!" })
    .toUpperCase()
    .refine((val) => /^(A|B|AB|O)[+-]$/.test(val), {
      message: "Invalid blood type! Use formats like A+, B-, O+, AB+.",
    }),

  img: z.string().optional().nullable(),
  
  // ✅ LOCKED DOWN STUDENT BIRTHDAY: Must be at least 3 years old and not in the future
  birthday: z.coerce.date({ message: "Birthday is required!" })
    .refine((val) => {
      const today = new Date();
      const minAgeDate = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());
      return val <= minAgeDate;
    }, {
      message: "Student must be at least 3 years old!",
    })
    .refine((val) => val <= new Date(), {
      message: "Birthday cannot be a future date!",
    }),

  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  parentId: z.string().min(1, { message: "Parent Id is required!" }),
});

export type StudentSchema = z.infer<typeof studentSchema>;

/* ================= EXAM SCHEMA ================= */
export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title name is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  lessonId: z.coerce.number({ message: "Lesson is required!" }),
});

export type ExamSchema = z.infer<typeof examSchema>;