export interface Application {
  id: string;
  userId: string;
  name: string;
  type: 'NIW' | 'EB-1A';
  status: 'draft' | 'in_progress' | 'submitted' | 'approved' | 'denied';
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationDTO {
  name: string;
  type: 'NIW' | 'EB-1A';
}

export interface UpdateApplicationDTO {
  name?: string;
  status?: Application['status'];
  progress?: number;
}
