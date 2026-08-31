export type Comment = {
  id: string;
  user: string;
  avatar: string;
  text: string;
};

export type VideoItem = {
  id: string;
  src: string;
  author: string;
  avatar: string;
  caption: string;
  likes: number;
  comments: Comment[];
};

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,ffd5dc,c0aede`;

export const videos: VideoItem[] = [
  {
    id: "1",
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    author: "lea.mtn",
    avatar: avatar("lea"),
    caption: "Petite session du soir 🌙 #loopup #vibes",
    likes: 12400,
    comments: [
      { id: "c1", user: "nino", avatar: avatar("nino"), text: "Trop stylé 🔥" },
      { id: "c2", user: "camille", avatar: avatar("camille"), text: "La musique 😍" },
    ],
  },
  {
    id: "2",
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    author: "theo.runs",
    avatar: avatar("theo"),
    caption: "On repart pour un tour 🚗💨",
    likes: 8321,
    comments: [{ id: "c3", user: "sarah", avatar: avatar("sarah"), text: "Ça envoie !" }],
  },
  {
    id: "3",
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    author: "mia.kdr",
    avatar: avatar("mia"),
    caption: "POV : tu découvres LoopUp ✨",
    likes: 45120,
    comments: [
      { id: "c4", user: "yanis", avatar: avatar("yanis"), text: "Le montage 👌" },
      { id: "c5", user: "ines", avatar: avatar("ines"), text: "Je boucle depuis 10min" },
    ],
  },
  {
    id: "4",
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    author: "sami.edits",
    avatar: avatar("sami"),
    caption: "Escapade rapide 🌿 #travel",
    likes: 2760,
    comments: [{ id: "c6", user: "lou", avatar: avatar("lou"), text: "Où c'est ??" }],
  },
];

export const formatCount = (n: number) =>
  n >= 1000000
    ? `${(n / 1000000).toFixed(1).replace(".0", "")}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(1).replace(".0", "")}K`
      : `${n}`;
