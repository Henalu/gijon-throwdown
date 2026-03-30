import { VolunteerRegistrationForm } from "./volunteer-registration-form";

export default function RegistroVoluntariosPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6 md:p-8">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-brand-green/72">
            Registro voluntarios
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">
            Deja tu solicitud para formar parte del equipo
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
            Esta fase no crea una cuenta automaticamente. Primero recogemos tu
            disponibilidad y la informacion logistica basica para que la
            organizacion pueda revisar bien cada alta.
          </p>

          <div className="mt-8 space-y-3">
            <div className="rounded-[1.35rem] bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">Que pedimos</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Nombre, email, talla de camiseta y cualquier restriccion
                alimentaria que debamos tener en cuenta.
              </p>
            </div>
            <div className="rounded-[1.35rem] bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">Que pasa despues</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                La solicitud queda pendiente. El equipo organizador la revisa y,
                si encaja, activa el siguiente paso de acceso interno.
              </p>
            </div>
          </div>
        </section>

        <VolunteerRegistrationForm />
      </div>
    </div>
  );
}
