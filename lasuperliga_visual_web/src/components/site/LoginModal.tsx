import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Lock, User } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Credenciales inválidas");
      }

      const data = await response.json();
      
      // Guardar tokens en localStorage
      // Nota: Esto funcionará si ambos sistemas están en el mismo dominio/puerto 
      // o si Hammercamp está configurado para leer de este origen.
      localStorage.setItem("token", data.access);
      localStorage.setItem("refresh", data.refresh);

      // También necesitamos la info del usuario
      const userResponse = await fetch("http://127.0.0.1:8000/api/user-info/", {
        headers: {
          Authorization: `Bearer ${data.access}`,
        },
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        localStorage.setItem("user", JSON.stringify(userData));
      }

      toast.success("Login exitoso. Redirigiendo...");
      
      // Redirigir al sistema Hammercamp
      // Asumimos que está en el puerto 5174 o en una ruta específica
      // Si están en diferentes puertos de localhost, el localStorage NO se comparte.
      // Una opción es pasar el token por la URL para que el otro sistema lo guarde.
      
      setTimeout(() => {
        // Redirigir al sistema Hammercamp pasando los tokens por URL para que el otro sistema los capture
        window.location.href = `http://localhost:5174/?token=${data.access}&refresh=${data.refresh}`; 
      }, 1500);

    } catch (error) {
      console.error(error);
      toast.error("Error al iniciar sesión. Verifique sus credenciales.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] border-primary/20 bg-surface">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display uppercase tracking-tight">
            Acceso <span className="text-primary">Hammercamp</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Ingrese sus credenciales para acceder al sistema de gestión.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="uppercase text-[10px] font-bold tracking-widest text-primary">Usuario</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                      <Input
                        placeholder="Ej: admin"
                        {...field}
                        className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="uppercase text-[10px] font-bold tracking-widest text-primary">Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest h-12 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando...
                </>
              ) : (
                "Entrar al Sistema"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
