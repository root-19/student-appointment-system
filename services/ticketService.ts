
import { Ticket, TicketCategory, Priority, User } from '../types';

export interface NewTicketInput {
  title: string;
  category: TicketCategory;
  subcategory: string;
  priority: Priority;
  description: string;
  attachment?: File | null;
}

/**
 * Generates a new sequential Ticket ID based on existing tickets.
 * Format: TICKET-{number}
 * Ensures sequential numbering based on the highest existing ID.
 */
export const generateTicketId = (existingTickets: Ticket[]): string => {
  if (!existingTickets || existingTickets.length === 0) {
    return 'TICKET-1';
  }

  // Extract numbers from IDs that match the TICKET-{number} format
  const ids = existingTickets
    .map(t => {
      // Match IDs like TICKET-1, TICKET-105, etc.
      const match = t.id.match(/^TICKET-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(num => !isNaN(num));

  // Find the highest number, defaulting to 0 if no valid IDs found
  const maxId = ids.length > 0 ? Math.max(...ids) : 0;
  
  // Return the next sequential ID
  return `TICKET-${maxId + 1}`;
};

/**
 * Creates a new Ticket object with all required metadata.
 */
export const createTicketObject = (
  input: NewTicketInput,
  user: User,
  existingTickets: Ticket[]
): Ticket => {
  const newId = generateTicketId(existingTickets);
  const now = new Date().toLocaleDateString();

  let attachmentData;
  if (input.attachment) {
    attachmentData = {
        name: input.attachment.name,
        url: URL.createObjectURL(input.attachment),
        type: input.attachment.type
    };
  }

  return {
    id: newId,
    title: input.title,
    category: input.category,
    subcategory: input.subcategory,
    priority: input.priority,
    status: 'Pending',
    description: input.description,
    submittedBy: user.id,
    studentName: user.name,
    submittedDate: now,
    lastUpdated: now,
    comments: [],
    attachment: attachmentData
  };
};
