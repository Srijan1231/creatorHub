"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { LifeBuoy, MessageCircle, Plus } from "lucide-react";

interface Ticket {
  _id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  responses: Array<{
    message: string;
    createdBy: string;
    createdAt: string;
  }>;
  createdAt: string;
}

export default function SupportPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  async function createTicket(formData: FormData) {
    try {
      setIsLoading(true);
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: formData.get("subject"),
          message: formData.get("message"),
          category: formData.get("category"),
          priority: formData.get("priority"),
        }),
      });

      if (!response.ok) throw new Error("Failed to create ticket");

      const newTicket = await response.json();
      setTickets([newTicket, ...tickets]);
      toast({
        title: "Ticket created",
        description: "Your support ticket has been submitted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create support ticket.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function addResponse(ticketId: string, message: string) {
    try {
      const response = await fetch(`/api/support/${ticketId}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error("Failed to add response");

      const updatedTicket = await response.json();
      setTickets(tickets.map(t => 
        t._id === ticketId ? updatedTicket : t
      ));
      toast({
        title: "Response added",
        description: "Your response has been added to the ticket.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add response.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Support</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              createTicket(new FormData(e.currentTarget));
            }} className="space-y-4">
              <div className="space-y-2">
                <Input
                  name="subject"
                  placeholder="Subject"
                  required
                />
              </div>
              <div className="space-y-2">
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Select name="priority" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Textarea
                  name="message"
                  placeholder="Describe your issue..."
                  required
                  rows={5}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Ticket"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <Card key={ticket._id} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{ticket.subject}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                  ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                  ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {ticket.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {ticket.priority}
                </span>
              </div>
            </div>
            <p className="mt-4">{ticket.message}</p>
            {ticket.responses.length > 0 && (
              <div className="mt-4 space-y-4">
                {ticket.responses.map((response, index) => (
                  <div key={index} className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {response.createdBy}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(response.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2">{response.message}</p>
                  </div>
                ))}
              </div>
            )}
            {ticket.status !== 'closed' && (
              <div className="mt-4 flex items-center space-x-2">
                <Input
                  placeholder="Add a response..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      addResponse(ticket._id, input.value);
                      input.value = '';
                    }
                  }}
                />
                <Button variant="outline" size="icon">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>
        ))}

        {tickets.length === 0 && (
          <Card className="p-12 text-center">
            <LifeBuoy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Support Tickets</h3>
            <p className="text-muted-foreground mb-4">
              Create a new ticket if you need help or have any questions.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Create Your First Ticket</Button>
              </DialogTrigger>
              {/* Dialog content same as above */}
            </Dialog>
          </Card>
        )}
      </div>
    </div>
  );
}