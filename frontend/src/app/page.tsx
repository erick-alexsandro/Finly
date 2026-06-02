{/* <main>StackAuth ficará aqui</main> */}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <h1 className="text-4xl font-bold">Bem-vindo ao OdontoSystem</h1>
      <p className="text-gray-500">Selecione um módulo para começar</p>
      
      <div className="flex gap-4">
        <Link href="/treatment/scheduling">
          <Button size="lg">Ir para Agenda</Button>
        </Link>
        
        
      </div>
    </div>
  );
}