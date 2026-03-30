export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalDocument = {
  href: string;
  title: string;
  shortTitle: string;
  description: string;
  eyebrow: string;
  intro: string;
  updatedAt: string;
  sections: LegalSection[];
};

export const legalDocuments: LegalDocument[] = [
  {
    href: "/privacidad",
    title: "Politica de privacidad",
    shortTitle: "Privacidad",
    description:
      "Como tratamos los datos personales que se recogen a traves de la web, los registros y las cuentas de la plataforma.",
    eyebrow: "Proteccion de datos",
    intro:
      "Esta pagina explica de forma general que informacion puede tratar Gijon Throwdown, para que se usa y que derechos tienen las personas que interactuan con la plataforma.",
    updatedAt: "Marzo 2026",
    sections: [
      {
        title: "Responsable del tratamiento",
        paragraphs: [
          "La gestion general del evento y de esta plataforma se realiza desde la organizacion de Gijon Throwdown. Como referencia publica actual, el sitio oficial identifica a TAJALAPIZ EVENTS S.L como titular del proyecto y canal administrativo.",
          "Para cuestiones relacionadas con privacidad, acceso o correccion de datos, la organizacion mantiene como canal de contacto administracion@tajalapizeventssl.es.",
        ],
      },
      {
        title: "Que datos se pueden recoger",
        paragraphs: [
          "La plataforma puede tratar datos de identificacion y contacto, datos de participacion deportiva y datos logisticos necesarios para operar el evento con normalidad.",
        ],
        bullets: [
          "Nombre y apellidos",
          "Correo electronico",
          "Rol dentro de la plataforma",
          "Equipo, categoria y participacion competitiva",
          "Talla de camiseta y restricciones alimentarias en registros de voluntariado o equipo",
          "Informacion operativa ligada al uso de cuentas, streaming, scoring o validacion",
        ],
      },
      {
        title: "Para que se usan esos datos",
        bullets: [
          "Gestionar preinscripciones de equipos y solicitudes de voluntariado",
          "Invitar usuarios internos y activar cuentas cuando corresponde",
          "Organizar heats, clasificaciones, validaciones y flujos operativos del evento",
          "Atender consultas, incidencias o comunicaciones relacionadas con la competicion",
          "Mantener una base historica razonable de participacion cuando sea util para futuras ediciones",
        ],
      },
      {
        title: "Base de legitimacion",
        paragraphs: [
          "El tratamiento puede apoyarse en el consentimiento de la persona interesada, en la ejecucion de medidas precontractuales o contractuales ligadas a la participacion en el evento, en obligaciones legales aplicables y en el interes legitimo de la organizacion para gestionar correctamente la competicion y su operativa.",
        ],
      },
      {
        title: "Conservacion de la informacion",
        paragraphs: [
          "Los datos no deberian mantenerse mas tiempo del necesario para gestionar la edicion activa, resolver incidencias, atender obligaciones legales y conservar un historico razonable de participacion cuando la persona siga vinculada al evento.",
          "La politica concreta de retencion y depuracion sigue siendo una decision de organizacion pendiente de cierre definitivo, pero la plataforma ya esta preparada para separar datos personales, cuentas y participaciones por edicion.",
        ],
      },
      {
        title: "Cesiones y proveedores",
        paragraphs: [
          "La organizacion puede apoyarse en proveedores tecnologicos para prestar el servicio, por ejemplo hosting, base de datos, autenticacion, almacenamiento multimedia o herramientas de streaming. Ese acceso se limita a lo necesario para operar la plataforma.",
          "No se plantea una venta de datos personales a terceros desde esta web.",
        ],
      },
      {
        title: "Derechos de las personas usuarias",
        paragraphs: [
          "Cualquier persona puede solicitar acceso, rectificacion, supresion, limitacion, oposicion o portabilidad cuando proceda, utilizando los canales de contacto de la organizacion.",
          "Si la solicitud afecta a una cuenta interna o a un perfil deportivo, conviene indicar el correo usado en la plataforma para acelerar la localizacion del registro.",
        ],
      },
      {
        title: "Seguridad y buenas practicas",
        paragraphs: [
          "La plataforma utiliza autenticacion, permisos por rol y controles de acceso sobre la base de datos para separar la parte publica de la operativa interna. Aun asi, ningun sistema conectado a internet puede garantizar riesgo cero, por lo que la organizacion revisa y limita el acceso a lo estrictamente necesario.",
        ],
      },
    ],
  },
  {
    href: "/cookies",
    title: "Politica de cookies",
    shortTitle: "Cookies",
    description:
      "Resumen de las cookies y tecnologias similares que pueden intervenir en la navegacion, el acceso a cuentas y la experiencia del evento.",
    eyebrow: "Navegacion y sesiones",
    intro:
      "Aqui se explica que tipos de cookies y mecanismos similares puede utilizar la plataforma para que la web funcione correctamente y para mantener sesiones, preferencias y servicios integrados.",
    updatedAt: "Marzo 2026",
    sections: [
      {
        title: "Que son las cookies",
        paragraphs: [
          "Las cookies son pequenos archivos o identificadores que se almacenan en el navegador para recordar informacion de una visita. En aplicaciones como esta tambien pueden intervenir otros mecanismos tecnicos equivalentes para mantener una sesion o cargar servicios concretos.",
        ],
      },
      {
        title: "Cookies tecnicas y esenciales",
        paragraphs: [
          "La plataforma necesita elementos tecnicos para navegar entre paginas, mantener sesiones autenticadas, proteger formularios y separar la parte publica de las superficies internas de admin o voluntariado.",
        ],
        bullets: [
          "Inicio de sesion y continuidad de la cuenta",
          "Seguridad basica de formularios y proteccion de rutas",
          "Persistencia minima de preferencias de navegacion",
        ],
      },
      {
        title: "Servicios integrados",
        paragraphs: [
          "Determinadas funcionalidades pueden apoyarse en proveedores o servicios externos, por ejemplo contenido embebido de streaming, almacenamiento multimedia o recursos tecnicos de autenticacion. Esos servicios pueden usar sus propias cookies o identificadores de sesion cuando sea necesario para prestar la funcionalidad.",
        ],
      },
      {
        title: "Analitica y medicion",
        paragraphs: [
          "La organizacion podra activar herramientas de medicion o analitica si las considera necesarias para mejorar la experiencia. Cuando eso ocurra, convendra revisar esta politica y adaptar la gestion del consentimiento a la configuracion final elegida.",
        ],
      },
      {
        title: "Como gestionar las cookies",
        bullets: [
          "Puedes revisar o eliminar cookies desde la configuracion de tu navegador",
          "Tambien puedes bloquearlas de forma selectiva o total",
          "Ten en cuenta que desactivar cookies tecnicas puede afectar al acceso a cuenta o al funcionamiento de la web",
        ],
      },
      {
        title: "Actualizaciones",
        paragraphs: [
          "Esta politica puede ajustarse si cambian los proveedores integrados, la configuracion de analitica o los requisitos legales aplicables a futuras ediciones del evento.",
        ],
      },
    ],
  },
  {
    href: "/bases-legales",
    title: "Bases legales del evento",
    shortTitle: "Bases legales",
    description:
      "Condiciones generales de participacion, composicion de equipos y reglas base que estructuran la relacion entre la organizacion y quienes compiten.",
    eyebrow: "Condiciones de participacion",
    intro:
      "Estas bases recogen el marco general de participacion del evento en esta plataforma. La organizacion puede completar o actualizar detalles concretos de cada edicion, categorias, horarios o standards mediante comunicacion oficial.",
    updatedAt: "Marzo 2026",
    sections: [
      {
        title: "Aceptacion de las bases",
        paragraphs: [
          "La preinscripcion, inscripcion o participacion en Gijon Throwdown implica la aceptacion de estas bases y de cualquier comunicacion operativa que la organizacion publique a traves de sus canales oficiales.",
        ],
      },
      {
        title: "Formato actual de equipo",
        paragraphs: [
          "La estructura actual del producto y del registro publico trabaja con equipos de 4 personas. La composicion prevista para esta edicion es de 1 chica y 3 chicos.",
          "En la preinscripcion digital, la persona situada como Atleta 1 actua ademas como responsable de contacto del equipo.",
        ],
      },
      {
        title: "Revision y confirmacion de plazas",
        paragraphs: [
          "El envio del formulario desde esta web no supone una plaza confirmada de forma automatica. Las solicitudes pueden quedar en estado pendiente hasta que la organizacion revise la informacion y confirme el siguiente paso.",
        ],
      },
      {
        title: "Datos veraces y cambios en la composicion",
        paragraphs: [
          "Cada equipo debe facilitar informacion veraz y mantenerla actualizada. La aceptacion de cambios, sustituciones o incidencias de roster queda sujeta a los criterios operativos y deportivos de la organizacion para cada edicion.",
        ],
      },
      {
        title: "Check-in, documentacion y seguridad",
        paragraphs: [
          "La organizacion puede exigir firma de documentos, aceptacion de descargos, acreditaciones o check-in presencial previo para poder competir. Ningun equipo deberia iniciar la competicion sin haber completado correctamente los requisitos documentales que se comuniquen para esa edicion.",
        ],
      },
      {
        title: "Sistema de puntuacion y clasificacion",
        paragraphs: [
          "La clasificacion oficial publicada en la plataforma debe depender de resultados validados y publicados por la organizacion. Los datos mostrados en el live pueden ser provisionales y no sustituyen la validacion oficial del leaderboard.",
        ],
      },
      {
        title: "Juego limpio y respeto al evento",
        paragraphs: [
          "Se espera una conducta deportiva y respetuosa hacia jueces, voluntariado, staff, rivales y organizacion. La falsedad de datos, el incumplimiento grave del reglamento o una conducta antideportiva pueden dar lugar a descalificacion o exclusion.",
        ],
      },
      {
        title: "Uso de imagen",
        paragraphs: [
          "La participacion en el evento puede implicar la captacion de imagen y video para fines informativos, promocionales o de archivo del propio Gijon Throwdown. La galeria oficial de esta plataforma forma parte de ese ecosistema de contenido del evento.",
        ],
      },
    ],
  },
  {
    href: "/aviso-legal",
    title: "Aviso legal",
    shortTitle: "Aviso legal",
    description:
      "Informacion general sobre titularidad del sitio, condiciones de uso, propiedad intelectual y limitacion de responsabilidad.",
    eyebrow: "Titularidad y uso del sitio",
    intro:
      "Este aviso legal regula de forma general el acceso y uso de la web, asi como la relacion basica entre la organizacion y las personas que navegan o utilizan la plataforma.",
    updatedAt: "Marzo 2026",
    sections: [
      {
        title: "Titularidad del sitio",
        paragraphs: [
          "Como referencia publica actual del proyecto, el sitio oficial de Gijon Throwdown identifica a TAJALAPIZ EVENTS S.L como titular de la web y del servicio informativo asociado al evento.",
          "Datos publicados actualmente en la web oficial: AV de los Campones, 62, 33211, Gijon, Asturias. CIF B22571079. Correo administrativo: administracion@tajalapizeventssl.es.",
        ],
      },
      {
        title: "Objeto del sitio",
        paragraphs: [
          "La plataforma facilita informacion sobre la competicion, acceso a registros, visionado de streaming, consulta de clasificaciones, uso de cuentas internas y acceso a servicios relacionados con la organizacion del evento.",
        ],
      },
      {
        title: "Condiciones de uso",
        paragraphs: [
          "El acceso a la parte publica de la web tiene caracter general e informativo. Algunas funcionalidades pueden requerir cuenta, invitacion previa o perfil autorizado segun el rol de la persona usuaria.",
          "Quien utiliza la web se compromete a hacerlo de forma licita, sin danar el servicio ni usarlo para fines fraudulentos, ofensivos o contrarios al interes del evento.",
        ],
      },
      {
        title: "Propiedad intelectual e industrial",
        paragraphs: [
          "Los textos, marcas, imagenes, videos, disenos, logos, nombres comerciales, fotos de la galeria y demas contenidos del sitio pertenecen a la organizacion o a sus respectivos titulares y no pueden reutilizarse fuera de los usos permitidos sin autorizacion.",
        ],
      },
      {
        title: "Enlaces y servicios de terceros",
        paragraphs: [
          "La web puede enlazar a redes sociales, proveedores de streaming, sistemas externos o plataformas auxiliares del evento. La organizacion no controla necesariamente el contenido o la disponibilidad permanente de esos servicios de terceros.",
        ],
      },
      {
        title: "Limitacion de responsabilidad",
        paragraphs: [
          "La organizacion procura mantener la informacion actualizada y el servicio operativo, pero no puede garantizar ausencia total de errores, interrupciones o incidencias tecnicas. El uso de la web se realiza bajo responsabilidad de la persona usuaria dentro de los limites previstos por la normativa aplicable.",
        ],
      },
      {
        title: "Modificaciones",
        paragraphs: [
          "La organizacion puede actualizar este aviso legal, el resto de documentos legales o cualquier contenido del sitio cuando lo considere necesario por razones operativas, tecnicas o normativas.",
        ],
      },
    ],
  },
];

export const legalDocumentLinks = legalDocuments.map(({ href, shortTitle }) => ({
  href,
  label: shortTitle,
}));

export function getLegalDocumentByHref(href: string) {
  return legalDocuments.find((document) => document.href === href);
}

export function requireLegalDocumentByHref(href: string): LegalDocument {
  const document = getLegalDocumentByHref(href);

  if (!document) {
    throw new Error(`Missing legal document for ${href}`);
  }

  return document;
}
