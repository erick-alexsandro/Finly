"use client";

import { NewQueryForms } from "./_components/new-query-forms";
import { CalendarEventCard } from "./_components/calendar-event-card";
import { apiFetch } from "@/lib/api";

import ShadcnBigCalendar from "@/components/shadcn-big-calendar/shadcn-big-calendar";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { format } from "date-fns/format";
import { RefreshCcw, SlidersHorizontal } from "lucide-react";
import moment from "moment";
import { SetStateAction, useState, useEffect, useCallback } from "react";
import type { CalendarProps } from "react-big-calendar";
import { momentLocalizer, Views } from "react-big-calendar";

moment.locale("pt-br");

const messages = {
  today: "Hoje",
  previous: "Anterior",
  next: "Próximo",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Evento",
  allDay: "Dia inteiro",
  noEventsInRange: "Nenhum evento neste período",
};

const localizer = momentLocalizer(moment);
// const API_BASE = "http://localhost:8080";

type CalendarEvent = {
  title: string;
  patient?: string;
  procedure?: string;
  start: Date;
  end: Date;
  variant?: "primary" | "secondary" | "outline";
};

export default function SchedulingPage() {
  const [view, setView] = useState(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [allDoctors, setAllDoctors] = useState<string[]>([]);
  const [procedimentosMap, setProcedimentosMap] = useState<
    Record<string, string>
  >({});
  const [reloadToken, setReloadToken] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const defaultFilters = {
    doctor: "",
    patient: "",
    startDate: "",
    endDate: "",
  };
  const [filters, setFilters] =
    useState<Record<string, string>>(defaultFilters);
  const [filtersDraft, setFiltersDraft] =
    useState<Record<string, string>>(defaultFilters);

  // ── Fetch appointments (scoped to the user's clinic via apiFetch headers) ──

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.doctor) params.append("doctor", filters.doctor);
      if (filters.patient) params.append("patient", filters.patient);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const res = await apiFetch(`/api/proxy/agendamentos?${params}`);
      if (!res.ok) {
        console.error(
          "Erro ao buscar agendamentos:",
          res.status,
          res.statusText,
        );
        return;
      }
      const data = await res.json();
      console.log("[fetchEvents] Raw data from API:", data);

      const formatted = data.map((item: any) => {
  // 1. Garantir que procedimentosIds seja um array, mesmo que o banco retorne null
  const idsDoBanco = item.procedimentosIds || [];
  
  const byId = idsDoBanco.length
    ? idsDoBanco.map((id: string) => procedimentosMap[id]).filter(Boolean)
    : [];

  const procedureText = byId.length > 0 
    ? byId.join(", ") 
    : (item.observacoes || "Procedimento não informado");

  // item.data is already a full ISO datetime like "2026-04-10T09:00:00"
  // We need to extract the date part and combine with horaInicio and horaFim
  const datePart = item.data.split('T')[0]; // "2026-04-10"
  
  const event = {
    title: item.profissionalNome || "Profissional não informado",
    patient: item.pacienteNome || "Sem nome",
    procedure: procedureText,
    start: new Date(`${datePart}T${item.horaInicio}:00`),
    end: new Date(`${datePart}T${item.horaFim}:00`),
    variant: "primary" as const,
  };
  
  console.log("[fetchEvents] Formatted event:", {
    raw: { data: item.data, horaInicio: item.horaInicio, horaFim: item.horaFim, datePart },
    formatted: event,
    startValid: event.start instanceof Date && !isNaN(event.start.getTime()),
    endValid: event.end instanceof Date && !isNaN(event.end.getTime()),
  });
  
  return event;
});

      console.log("[fetchEvents] Total events formatted:", formatted.length);
      setEvents(formatted);
    } catch (err) {
      console.error("Erro na busca de agendamentos:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, procedimentosMap]);

  // ── Initial load ───────────────────────────────────────────────────────────

  useEffect(() => {
    const loadProcedimentos = async () => {
      try {
        const res = await apiFetch(`/api/proxy/procedimentos`);
        if (!res.ok) return;
        const data = await res.json();
        const map: Record<string, string> = {};
        data.forEach((p: any) => {
          if (p?.id != null) map[String(p.id)] = p.nome || "Procedimento";
        });
        setProcedimentosMap(map);
      } catch {}
    };

    const loadDoctors = async () => {
      try {
        const res = await apiFetch(`/api/proxy/profissionais`);
        if (!res.ok) return;
        const data = await res.json();
        setAllDoctors(data.map((p: any) => p.nome).filter(Boolean));
      } catch {}
    };

    loadProcedimentos();
    loadDoctors();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, reloadToken]);

  // Called by NewQueryForms after a successful save → refresh calendar
  const handleAgendamentoSalvo = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  const handleRefresh = () => setReloadToken((t) => t + 1);
  const handleNavigate = (d: Date) => setDate(d);
  const handleViewChange = (v: SetStateAction<any>) => setView(v);

  const professionalColors = [
    "#3B82F6", "#EF4444", "#10B981", "#F59E0B",
    "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
  ];

  const getProfessionalColor = (name: string) => {
    const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return professionalColors[hash % professionalColors.length];
  };

  const eventPropGetter: CalendarProps<CalendarEvent>["eventPropGetter"] = (
    e,
  ) => ({
    className: `event-variant-${e.variant ?? "primary"}`,
    style: {
      borderLeft: `4px solid ${getProfessionalColor(e.title)}`,
    },
  });

  const filteredEvents = events.filter((e) => {
    if (filters.doctor && e.title !== filters.doctor) return false;
    if (
      filters.patient &&
      !e.patient?.toLowerCase().includes(filters.patient.toLowerCase())
    )
      return false;
    if (
      filters.startDate &&
      moment(e.start).isBefore(
        moment(filters.startDate, "YYYY-MM-DD").startOf("day"),
      )
    )
      return false;
    if (
      filters.endDate &&
      moment(e.start).isAfter(
        moment(filters.endDate, "YYYY-MM-DD").endOf("day"),
      )
    )
      return false;
    return true;
  });

  console.log("[scheduling] Events state:", { total: events.length, filtered: filteredEvents.length, events: filteredEvents });

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== "",
  ).length;

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 overflow-hidden pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Agenda
          </h2>
          <p className="text-muted-foreground italic text-sm">
            Controle de consultas e horários
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={handleRefresh}
          >
            <RefreshCcw />
          </Button>

          <Sheet>
            <SheetTrigger>
              <Button
                variant="outline"
                className="relative gap-2 cursor-pointer"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtrar Agenda</SheetTitle>
              </SheetHeader>
              <FieldGroup className="px-5">
                <FieldSet>
                  <FieldDescription>
                    Refine a visualização dos eventos
                  </FieldDescription>
                  <div className="space-y-4 pt-4">
                    <Field>
                      <FieldLabel>Paciente</FieldLabel>
                      <Input
                        placeholder="Nome do paciente"
                        value={filtersDraft.patient}
                        onChange={(e) =>
                          setFiltersDraft({
                            ...filtersDraft,
                            patient: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Doutor</FieldLabel>
                      <Select
                        value={filtersDraft.doctor}
                        onValueChange={(v) =>
                          setFiltersDraft({
                            ...filtersDraft,
                            doctor: v === "none" ? "" : v ?? "",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o doutor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Todos</SelectItem>
                          {allDoctors.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel>Data Inicial</FieldLabel>
                      <DatePicker
                        date={
                          filtersDraft.startDate
                            ? (() => {
                                const [y, m, d] = filtersDraft.startDate
                                  .split("-")
                                  .map(Number);
                                return new Date(y, m - 1, d);
                              })()
                            : undefined
                        }
                        setDate={(d) =>
                          setFiltersDraft({
                            ...filtersDraft,
                            startDate: d ? format(d, "yyyy-MM-dd") : "",
                          })
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Data Final</FieldLabel>
                      <DatePicker
                        date={
                          filtersDraft.endDate
                            ? (() => {
                                const [y, m, d] = filtersDraft.endDate
                                  .split("-")
                                  .map(Number);
                                return new Date(y, m - 1, d);
                              })()
                            : undefined
                        }
                        setDate={(d) =>
                          setFiltersDraft({
                            ...filtersDraft,
                            endDate: d ? format(d, "yyyy-MM-dd") : "",
                          })
                        }
                      />
                    </Field>
                  </div>
                </FieldSet>
                <div className="flex flex-col gap-2 pt-6">
                  <Button onClick={() => setFilters(filtersDraft)}>
                    Aplicar filtros
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters(defaultFilters);
                      setFiltersDraft(defaultFilters);
                    }}
                  >
                    Limpar
                  </Button>
                </div>
              </FieldGroup>
            </SheetContent>
          </Sheet>

          {/* Pass onSuccess so the calendar refreshes after a new appointment is saved */}
          <NewQueryForms onSuccess={handleAgendamentoSalvo} />
        </div>
      </div>

      <div className="relative rounded-xl border bg-card text-card-foreground shadow">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}
        <div className="p-1 sm:p-4">
          {isLoading && filteredEvents.length === 0 ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 w-full animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : (
            <ShadcnBigCalendar
              localizer={localizer}
              messages={messages}
              components={{
                event: (props: any) => (
                  <CalendarEventCard {...props} showHover={true} />
                ),
                agenda: {
                  event: (props: any) => (
                    <CalendarEventCard {...props} showHover={false} />
                  ),
                },
              }}
              style={{ height: "calc(100vh - 250px)", minHeight: "600px" }}
              className="border-none"
              date={date}
              onNavigate={handleNavigate}
              view={view}
              onView={handleViewChange}
              events={filteredEvents}
              eventPropGetter={eventPropGetter}
              allDayAccessor={() => false}
            />
          )}
        </div>
      </div>
    </main>
  );
}
