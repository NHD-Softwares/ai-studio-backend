import z from 'zod';

const editUserSchema = z.object({
  name: z.string('Name is required').trim().min(1, 'Name is required'),
});

type IEditUserSchema = z.infer<typeof editUserSchema>;

export { editUserSchema };
export { type IEditUserSchema };
