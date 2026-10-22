export type Menu = {
  id: string;
  title: string;
  emoji: string;
  blurb: string;
  commands: { cmd: string; desc: string }[];
};

export const PREFIX = ".";

export const MENUS: Menu[] = [
  { id: "games", title: "Games", emoji: "🎮", blurb: "Group mini-games", commands: [
    { cmd: "ttt", desc: "Tic-tac-toe vs a member" },
    { cmd: "quiz", desc: "Start a trivia round" },
    { cmd: "wordchain", desc: "Word chain game" },
    { cmd: "dice", desc: "Roll the dice" },
  ]},
  { id: "economy", title: "Economy", emoji: "💰", blurb: "Coins, bank & shop", commands: [
    { cmd: "daily", desc: "Claim daily coins" },
    { cmd: "bal", desc: "Check wallet & bank" },
    { cmd: "work", desc: "Earn coins" },
    { cmd: "shop", desc: "Browse items" },
    { cmd: "rob", desc: "Try to rob someone" },
    { cmd: "lb", desc: "Richest players" },
  ]},
  { id: "pokemon", title: "Pokémon", emoji: "⚡", blurb: "Catch & battle", commands: [
    { cmd: "catch", desc: "Catch a wild Pokémon" },
    { cmd: "party", desc: "View your team" },
    { cmd: "battle", desc: "Challenge a trainer" },
    { cmd: "evolve", desc: "Evolve a Pokémon" },
  ]},
  { id: "cards", title: "Cards & Auctions", emoji: "🃏", blurb: "Collect and trade", commands: [
    { cmd: "claim", desc: "Claim a spawned card" },
    { cmd: "deck", desc: "Your card collection" },
    { cmd: "auction", desc: "List a card for auction" },
    { cmd: "bid", desc: "Bid on an auction" },
  ]},
  { id: "dbz", title: "Dragon Ball", emoji: "🐉", blurb: "Power-up battles", commands: [
    { cmd: "fighter", desc: "Pick your fighter" },
    { cmd: "train", desc: "Raise power level" },
    { cmd: "dbattle", desc: "Fight another player" },
    { cmd: "dragonballs", desc: "Hunt the 7 balls" },
  ]},
  { id: "fun", title: "Fun", emoji: "🎉", blurb: "Jokes & reactions", commands: [
    { cmd: "joke", desc: "Random joke" },
    { cmd: "ship", desc: "Ship two members" },
    { cmd: "meme", desc: "Random meme" },
    { cmd: "truth", desc: "Truth or dare" },
  ]},
  { id: "mods", title: "Mods", emoji: "🛡️", blurb: "Keep groups clean", commands: [
    { cmd: "kick", desc: "Remove a member" },
    { cmd: "warn", desc: "Warn a member" },
    { cmd: "antilink", desc: "Toggle anti-link" },
    { cmd: "mute", desc: "Admins-only chat" },
  ]},
  { id: "owner", title: "Owner", emoji: "👑", blurb: "Full bot control", commands: [
    { cmd: "broadcast", desc: "Message all groups" },
    { cmd: "addmod", desc: "Promote a bot mod" },
    { cmd: "ban", desc: "Ban a user from bot" },
    { cmd: "restart", desc: "Restart the bot" },
  ]},
];
