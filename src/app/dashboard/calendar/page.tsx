"use client";

import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Users, Filter } from "lucide-react";

interface LeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  status: string;
  numberOfDays: number;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    department: { name: string };
  };
  leaveType: {
    id: number;
    name: string;
    color: string | null;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    leaveRequest: LeaveRequest;
  };
}

interface Department {
  id: number;
  name: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("approved");
  const [selectedEvent, setSelectedEvent] = useState<LeaveRequest | null>(null);
  const calendarRef = useRef<FullCalendar>(null);

  const addOneDay = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split("T")[0];
  };

  const getStatusColorValue = (status: string) => {
    switch (status) {
      case "approved":
        return "#22c55e";
      case "pending":
        return "#f59e0b";
      case "rejected":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const fetchLeaveRequests = React.useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/leave-requests?status=${selectedStatus}`;
      if (selectedDepartment !== "all") {
        url += `&departmentId=${selectedDepartment}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data: LeaveRequest[] = await res.json();
        const calendarEvents = data.map((request) => ({
          id: request.id.toString(),
          title: `${request.employee.firstName} ${request.employee.lastName} - ${request.leaveType.name}`,
          start: request.startDate,
          end: addOneDay(request.endDate), // FullCalendar end date is exclusive
          backgroundColor:
            request.leaveType.color || getStatusColorValue(request.status),
          borderColor:
            request.leaveType.color || getStatusColorValue(request.status),
          extendedProps: {
            leaveRequest: request,
          },
        }));
        setEvents(calendarEvents);
      }
    } catch {
      toast.error("Erreur lors du chargement des absences");
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment, selectedStatus]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch {
      toast.error("Erreur lors du chargement des départements");
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event.extendedProps.leaveRequest);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Approuvé";
      case "pending":
        return "En attente";
      case "rejected":
        return "Refusé";
      case "cancelled":
        return "Annulé";
      default:
        return status;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Count by leave type for legend
  const leaveTypeCounts = events.reduce((acc, event) => {
    const leaveType = event.extendedProps.leaveRequest.leaveType.name;
    acc[leaveType] = (acc[leaveType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Calendrier des Absences
          </h1>
          <p className="text-muted-foreground">
            Visualisez les absences de l&apos;équipe
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtres:</span>
            </div>
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Département" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les départements</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="approved">Approuvés</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="rejected">Refusés</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{events.length} absence(s)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      {Object.keys(leaveTypeCounts).length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Légende</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-4">
              {Object.entries(leaveTypeCounts).map(([type, count]) => {
                const event = events.find(
                  (e) => e.extendedProps.leaveRequest.leaveType.name === type
                );
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: event?.backgroundColor }}
                    />
                    <span className="text-sm">
                      {type} ({count})
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <Skeleton className="h-[600px]" />
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale={frLocale}
              events={events}
              eventClick={handleEventClick}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,dayGridWeek",
              }}
              buttonText={{
                today: "Aujourd'hui",
                month: "Mois",
                week: "Semaine",
              }}
              height="auto"
              eventDisplay="block"
              displayEventTime={false}
            />
          )}
        </CardContent>
      </Card>

      {/* Event Detail Dialog */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de l&apos;absence</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Employé</p>
                  <p className="font-medium">
                    {selectedEvent.employee.firstName}{" "}
                    {selectedEvent.employee.lastName}
                  </p>
                </div>
                <Badge
                  variant={
                    getStatusBadgeVariant(selectedEvent.status) as
                      | "default"
                      | "secondary"
                      | "destructive"
                      | "outline"
                  }
                >
                  {getStatusLabel(selectedEvent.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Département</p>
                  <p className="font-medium">
                    {selectedEvent.employee.department.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Type d&apos;absence
                  </p>
                  <div className="flex items-center gap-2">
                    {selectedEvent.leaveType.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: selectedEvent.leaveType.color,
                        }}
                      />
                    )}
                    <p className="font-medium">
                      {selectedEvent.leaveType.name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date de début</p>
                  <p className="font-medium">
                    {format(new Date(selectedEvent.startDate), "d MMMM yyyy", {
                      locale: fr,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date de fin</p>
                  <p className="font-medium">
                    {format(new Date(selectedEvent.endDate), "d MMMM yyyy", {
                      locale: fr,
                    })}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Durée</p>
                <p className="font-medium">
                  {selectedEvent.numberOfDays} jour(s)
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedEvent(null)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
