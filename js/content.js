// All editable content lives here.

window.SITE = {};

SITE.person = {
  name: "Yukteswar Mantha",
  role: "AI research · Plaksha University",
  tagline: "CSAI undergrad building towards AI research engineering. I work on Computer Vision and LLMs.",
};

// Shared problem statement shown on both paper pages.
SITE.problem = {
  question: "How can you generate real-time synthetic trajectories from sparse data for Gurgaon City?",
  context:
    "GPS traces in Gurgaon are sparse: a phone pings, goes quiet for hundreds of metres, then pings again. " +
    "Dense, road-faithful trajectories are what downstream work needs (traffic simulation, routing, privacy-safe data sharing), " +
    "and they have to be produced fast enough to keep up with a live city.",
};

// Scroll-tour steps. `mode` picks what the map draws: graph | sparse | seed | control | realtime.
var TOUR_START = [
  { mode: "graph", title: "Gurgaon, as a graph", pre: "This is", em: "Gurgaon", post: ", every major road as a graph." },
  { mode: "sparse", title: "Real data is sparse", pre: "Real GPS here is", em: "sparse", post: ". A ping, a gap, another ping." },
];
var TOUR_END = { mode: "realtime", title: "Now, in real time", pre: "The goal: do it", em: "in real time", post: ", for a whole city." };

SITE.papers = [
  {
    id: "seed",
    page: "seed.html",
    short: "Seed",
    title: "Seed: Bridging Sequence and Diffusion Models for Road Trajectory Generation",
    authors: "Rao, Shang, Jiang, Han, Chen",
    venue: "WWW 2025",
    accent: "#2261e9",
    blurb: "Transformer meets diffusion, one road segment at a time.",
    summary:
      "Sequence models give trajectories regularity; diffusion models give diversity. Seed gets both: a Transformer models movement along road segments, and a conditional diffusion model recovers each next segment from noise, trained with curriculum learning.",
    why: "Segment-level generation is a natural fit for sparse pings: each new segment only needs the road context around it, so gaps can be filled one step at a time.",
    keyIdeas: ["Transformer + diffusion", "Segment-by-segment generation", "Curriculum learning"],
    href: "https://doi.org/10.1145/3696410.3714951",
    linkLabel: "Read on ACM",
    tour: TOUR_START.concat([
      { mode: "seed", title: "Seed: one segment at a time", pre: "Seed fills the gaps", em: "segment by segment", post: ", like a sentence." },
      TOUR_END,
    ]),
  },
  {
    id: "controltraj",
    page: "controltraj.html",
    short: "ControlTraj",
    title: "ControlTraj: Controllable Trajectory Generation with Topology-Constrained Diffusion Model",
    authors: "Zhu, Yu, Zhao, Liu, Ye, Chen, Zhang, Wei, Liang",
    venue: "KDD 2024",
    accent: "#762ed2",
    blurb: "Diffusion that stays on the roads, even in unseen cities.",
    summary:
      "A diffusion model steered by road-network topology. RoadMAE embeds road segments, and a geographic attention UNet (GeoUNet) denoises trajectories conditioned on them, so the model transfers to unseen cities without retraining.",
    why: "Zero-shot transfer matters for Gurgaon, where dense labelled trajectories are hard to come by. The road graph itself becomes the supervision.",
    keyIdeas: ["Topology-constrained diffusion", "RoadMAE + GeoUNet", "Zero-shot city transfer"],
    href: "https://arxiv.org/abs/2404.15380",
    linkLabel: "Read on arXiv",
    tour: TOUR_START.concat([
      { mode: "control", title: "ControlTraj: stay on the roads", pre: "ControlTraj denoises with the", em: "road topology", post: " as a guide." },
      TOUR_END,
    ]),
  },
];

SITE.interests = [
  {
    name: "Computer Vision",
    accent: "#0e6a9b",
    art: "vision",
    text: "How models see and understand scenes, from everyday images to the aerial view from a drone.",
  },
  {
    name: "LLMs",
    accent: "#90661f",
    art: "llm",
    text: "Language models that keep learning without forgetting, and small models that punch above their weight.",
  },
];

// "Writing & LLM work" cards
SITE.work = [
  {
    title: "The Continual Learning Cookbook",
    kind: "Writing",
    accent: "#0a3149",
    art: "cookbook",
    text: "A 12-chapter field guide to models that keep learning without forgetting, written as recipe cards.",
    href: "https://yukteswar23.github.io/continual-learning-cookbook/",
  },
  {
    title: "SLM Bug Localizer",
    kind: "LLM",
    accent: "#90661f",
    art: "llm",
    text: "Finding where a bug lives with small language models (4B or less), fully offline on a 4 GB GPU, evaluated on SWE-bench Lite.",
    href: "https://github.com/yukteswar23/slm-bug-localizer",
  },
];

SITE.links = {
  email: "ymantha23@gmail.com",
  linkedin: "https://www.linkedin.com/in/yukteswar-mantha/",
  github: "https://github.com/yukteswar23",
};
