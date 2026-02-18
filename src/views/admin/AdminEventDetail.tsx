'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Loader2, Calendar, XCircle, Lock, Unlock, Ticket } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "@/contexts/LocaleContext";
import Link from "next/link";
import { getEventDetail, cancelEvent, closeEvent, reopenEvent, cancelBooking } from "@/services/adminService";

export default function AdminEventDetailPage() {
  const params = useParams();
  const eventId = params?.id as string;
  const { pathWithLocale } = useLocale();
  const { toast } = useToast();

  const [detail, setDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const data = await getEventDetail(eventId);
    setDetail(data);
    setLoading(false);
  };

  useEffect(() => {
    if (eventId) fetchData();
  }, [eventId]);

  const handleAction = async (action: "cancel" | "close" | "reopen") => {
    setActionLoading(true);
    let success = false;
    switch (action) {
      case "cancel": success = await cancelEvent(eventId, "Cancelled by admin"); break;
      case "close": success = await closeEvent(eventId); break;
      case "reopen": success = await reopenEvent(eventId); break;
    }
    setActionLoading(false);
    if (success) { toast({ title: `Event ${action}${action === "close" ? "d" : action === "reopen" ? "ed" : "led"}` }); fetchData(); }
    else { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const success = await cancelBooking(bookingId, "Cancelled by admin");
    if (success) { toast({ title: "Booking cancelled" }); fetchData(); }
    else { toast({ title: "Error", variant: "destructive" }); }
  };

  if (loading) {
    return <AdminLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></AdminLayout>;
  }

  if (!detail?.event) {
    return <AdminLayout><div className="text-center py-20"><p className="text-muted-foreground">Event not found</p><Link href={pathWithLocale("/admin/events")}><Button variant="link" className="mt-4">Back to events</Button></Link></div></AdminLayout>;
  }

  const { event, bookings } = detail;
  const statusColors: Record<string, string> = { open: "bg-green-500/10 text-green-600", closed: "bg-gray-500/10 text-gray-600", cancelled: "bg-red-500/10 text-red-600" };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={pathWithLocale("/admin/events")}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold capitalize">{event.meetup_type} — {event.city}</h1>
            <p className="text-sm text-muted-foreground">
              {event.date_time ? format(new Date(event.date_time), "EEEE, MMM d 'at' HH:mm") : "—"}
            </p>
          </div>
          <Badge className={statusColors[event.status] || statusColors.open}>{event.status}</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle>Event Info</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{event.meetup_type}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">City</span><span>{event.city}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Neighborhood</span><span>{event.neighborhood || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Min Participants</span><span>{event.min_participants}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Max Participants</span><span>{event.max_participants}</span></div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {event.status === "open" && (
                <>
                  <Button variant="outline" onClick={() => handleAction("close")} disabled={actionLoading}>
                    <Lock className="h-4 w-4 mr-2" /> Close Event
                  </Button>
                  <Button variant="destructive" onClick={() => handleAction("cancel")} disabled={actionLoading}>
                    <XCircle className="h-4 w-4 mr-2" /> Cancel Event
                  </Button>
                </>
              )}
              {event.status === "closed" && (
                <Button variant="outline" onClick={() => handleAction("reopen")} disabled={actionLoading}>
                  <Unlock className="h-4 w-4 mr-2" /> Reopen Event
                </Button>
              )}
              {event.status === "cancelled" && (
                <p className="text-sm text-muted-foreground">Event has been cancelled.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Bookings ({bookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No bookings</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">User</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Booked At</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b: any) => (
                      <tr key={b.id} className="border-b">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={b.profiles?.avatar_url || undefined} />
                              <AvatarFallback>{b.profiles?.full_name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <Link href={pathWithLocale(`/admin/users/${b.user_id}`)} className="hover:underline text-primary">
                              {b.profiles?.full_name || b.user_id.slice(0, 8)}
                            </Link>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant={b.status === "confirmed" ? "default" : b.status === "cancelled" ? "destructive" : "secondary"}>
                            {b.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {format(new Date(b.created_at), "MMM d, yyyy")}
                        </td>
                        <td className="py-3 px-2">
                          {b.status !== "cancelled" && (
                            <Button size="sm" variant="destructive" onClick={() => handleCancelBooking(b.id)}>
                              Cancel
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
