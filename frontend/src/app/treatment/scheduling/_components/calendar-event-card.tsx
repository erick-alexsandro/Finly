import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { CalendarDays, Star } from "lucide-react"; // Importei o ícone Activity para o procedimento
import moment from "moment";

// 1. Atualizamos a interface para incluir o procedimento (procedure)
interface CalendarEvent {
  title: string;
  patient?: string;
  procedure?: string;
  start: Date;
  end: Date;
  variant?: string;
}

type CalendarEventCardProps = {
  event: CalendarEvent;
  showHover?: boolean;
  [key: string]: any;
};

export function CalendarEventCard({
  event,
  showHover = true,
}: CalendarEventCardProps) {
  const eventSummary = (
    <div className="w-full h-full cursor-pointer p-1" title="">
      <p className="font-medium leading-none truncate">{event.title}</p>
      {event.patient && <p className="opacity-80 truncate">{event.patient}</p>}
      {event.procedure && (
        <p className="text-xs opacity-80 truncate">{event.procedure}</p>
      )}
    </div>
  );

  if (!showHover) {
    return eventSummary;
  }

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>{eventSummary}</HoverCardTrigger>
      <HoverCardContent className="z-[100]">
        <div className="flex justify-between space-x-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{event.title}</h4>
            <p className="text-sm">
              <span className="font-medium text-muted-foreground">Paciente:</span> {event.patient || "Não informado"}
            </p>
            <div className="flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded text-xs font-medium">
              <Star className="h-3 w-3" />
              {event.procedure || "Consulta Geral"}
            </div>
            <div className="flex items-center pt-2">
              <CalendarDays className="mr-2 h-4 w-4 opacity-70" />{" "}
              <span className="text-xs text-muted-foreground">
                {moment(event.start).format("DD [de] MMMM")} • {moment(event.start).format("HH:mm")} - {moment(event.end).format("HH:mm")}
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
