import news1 from "@/assets/news-1.jpg";
import news2 from "@/assets/news-2.jpg";
import news3 from "@/assets/news-3.jpg";
import news4 from "@/assets/news-4.jpg";
import news5 from "@/assets/news-5.jpg";
import news6 from "@/assets/news-6.jpg";
import hero from "@/assets/hero-ball.jpg";

export type News = {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
};

export const heroImage = hero;

export const news: News[] = [
  {
    id: "fecha-suspendida",
    category: "General",
    title: "Fecha suspendida por lluvia",
    excerpt:
      "Todas las categorías jugarán el sábado 16 de mayo, manteniendo el mismo horario y rival programados originalmente.",
    date: "9 de mayo, 2026",
    image: news3,
  },
  {
    id: "tolosa-campeon",
    category: "F11 +40",
    title: "Tolosa se quedó con el título",
    excerpt:
      "El equipo de Tolosa cerró un torneo perfecto y levantó la copa de Primera A tras vencer en la final por 2 a 1.",
    date: "2 de mayo, 2026",
    image: news2,
  },
  {
    id: "azulado-campeon",
    category: "F11 Libre",
    title: "Azulado, campeón invicto",
    excerpt:
      "Sin perder un solo partido en todo el campeonato, Azulado se consagró campeón en una jornada inolvidable.",
    date: "2 de mayo, 2026",
    image: news1,
  },
  {
    id: "bonfield-arbitro",
    category: "F11 Libre",
    title: "Bonfield perdió chances y será árbitro de la final",
    excerpt:
      "Una caída inesperada lo deja afuera de la pelea por el título. El próximo fin de semana dirigirá la final.",
    date: "7 de mayo, 2026",
    image: news4,
  },
  {
    id: "criadores-quilmes",
    category: "F7 Masc",
    title: "Criadores SS goleó 4 a 2 a Quilmes",
    excerpt:
      "Una victoria contundente que deja a Quilmes solo en el fondo de la tabla y aprieta la zona de clasificación.",
    date: "7 de mayo, 2026",
    image: news5,
  },
  {
    id: "criba-pelusa",
    category: "F7 Masc",
    title: "Criba reeditó un 7 a 0 ante Pelusa",
    excerpt:
      "Clásico con goleada histórica. Criba volvió a imponer condiciones y se mantiene firme en lo más alto.",
    date: "7 de mayo, 2026",
    image: news6,
  },
  {
    id: "preguntale-a-el",
    category: "F11 +50",
    title: "Pregúntale a Él, a un paso del título",
    excerpt:
      "Triunfo clave que lo deja muy cerca de levantar la copa. Le alcanza con un empate en la próxima fecha.",
    date: "7 de mayo, 2026",
    image: news1,
  },
  {
    id: "borussia-villalenci",
    category: "F7 Fem",
    title: "Borussia goleó 3 a 0 a Villa Lenci",
    excerpt:
      "El líder no afloja y suma una nueva victoria que lo afirma en lo más alto de la tabla de posiciones.",
    date: "7 de mayo, 2026",
    image: news2,
  },
  {
    id: "clasico-colonia",
    category: "F7 Fem",
    title: "El clásico interzonal fue para Colonia Sambo",
    excerpt:
      "En un partido cargado de emoción y goles, Colonia se llevó los tres puntos del clásico más esperado del año.",
    date: "7 de mayo, 2026",
    image: news5,
  },
];
