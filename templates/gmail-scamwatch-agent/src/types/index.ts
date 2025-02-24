export interface recentEmails {
  id: string;
  sender: string;
  headers: { name: string; value: string }[];
  body: string;
}
