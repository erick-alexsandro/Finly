declare module 'react-big-calendar' {
  import { ComponentType, ReactNode } from 'react';

  export interface Event {
    title: string;
    start: Date;
    end: Date;
    [key: string]: any;
  }

  export interface View {
    [key: string]: any;
  }

  export const Views: {
    MONTH: string;
    WEEK: string;
    WORK_WEEK: string;
    DAY: string;
    AGENDA: string;
  };

  export interface Localizer {
    format(value: Date, format: string, culture?: string): string;
    parse(value: string, format: string, culture?: string): Date;
    startOf(value: Date, unit: string, culture?: string): Date;
    endOf(value: Date, unit: string, culture?: string): Date;
    range(start: Date, end: Date, unit: string, culture?: string): Date[];
    diffRange(
      start: Date,
      end: Date,
      unit: string,
      culture?: string,
    ): {
      start: Date;
      end: Date;
    };
    isSameMonth(a: Date, b: Date, culture?: string): boolean;
    hasSameTime(a: Date, b: Date): boolean;
    inRange(date: Date, start: Date, end: Date, unit?: string, culture?: string): boolean;
    startOf(date: Date, unit: string): Date;
  }

  export function momentLocalizer(moment: any): Localizer;

  export interface CalendarProps<T extends Event = Event> {
    localizer: Localizer;
    events: T[];
    date?: Date;
    view?: string;
    onView?: (view: string) => void;
    onNavigate?: (date: Date) => void;
    style?: React.CSSProperties;
    className?: string;
    messages?: Record<string, string>;
    eventPropGetter?: (event: T) => { className?: string; style?: React.CSSProperties };
    components?: {
      event?: ComponentType<any>;
      agenda?: {
        event?: ComponentType<any>;
      };
    };
    allDayAccessor?: (event: T) => boolean;
    [key: string]: any;
  }

  const Calendar: ComponentType<CalendarProps>;
  export default Calendar;
}
