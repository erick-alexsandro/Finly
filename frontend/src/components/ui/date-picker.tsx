    "use client"

    import * as React from "react"
    import { format } from "date-fns"
    import { ptBR } from "date-fns/locale"
    import { ChevronDownIcon } from "lucide-react"
    import { cn } from "@/lib/utils"
    import { Button } from "@/components/ui/button"
    import { Calendar } from "@/components/ui/calendar"
    import {
    Popover,
    PopoverContent,
    PopoverTrigger,
    } from "@/components/ui/popover"

    export function DatePicker({ date, setDate }: { date: Date | undefined; setDate: (date: Date | undefined) => void }) {
    return (
        <Popover>
        {/* Aqui está o segredo: usando o padrão 'render' do Base UI que é mais estável */}
        <PopoverTrigger 
            render={
            <Button 
                variant={"outline"} 
                className={cn("w-full justify-between text-left font-normal", !date && "text-muted-foreground")}
            >
                {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
            </Button>
            } 
        />
        <PopoverContent className="w-auto p-0" align="start">
            <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
            locale={ptBR}
            />
        </PopoverContent>
        </Popover>
    )
    }