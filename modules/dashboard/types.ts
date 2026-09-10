export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role?: string | null;     
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string | null;     
  user: User | null;       
}
