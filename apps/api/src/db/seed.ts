import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { quotes } from "./schema";

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));
  const items = [
    { text: "A disciplina Ã© a ponte entre metas e realizaÃ§Ãµes.", author: "Jim Rohn", category: "disciplina" },
    { text: "VocÃª nÃ£o precisa ser extremo, sÃ³ consistente.", author: "James Clear", category: "hÃ¡bito" },
    { text: "O homem que move montanhas comeÃ§a carregando pequenas pedras.", author: "ConfÃºcio", category: "persistÃªncia" },
    { text: "Pequenos progressos diÃ¡rios somam grandes resultados.", author: "Robin Sharma", category: "progresso" },
    { text: "A melhor hora para plantar uma Ã¡rvore foi hÃ¡ 20 anos. A segunda melhor Ã© agora.", author: "ProvÃ©rbio chinÃªs", category: "aÃ§Ã£o" },
    { text: "VocÃª Ã© o que faz repetidamente. A excelÃªncia nÃ£o Ã© um ato, Ã© um hÃ¡bito.", author: "AristÃ³teles", category: "hÃ¡bito" },
    { text: "Foco nÃ£o Ã© dizer sim. Ã‰ dizer nÃ£o a mil coisas boas.", author: "Steve Jobs", category: "foco" },
    { text: "Cada depÃ³sito Ã© uma promessa cumprida a vocÃª mesmo.", author: null, category: "dinheiro" },
    { text: "Forje o hÃ¡bito. O hÃ¡bito forja vocÃª.", author: null, category: "identidade" },
    { text: "O corpo de hoje Ã© o resultado das escolhas de ontem; o de amanhÃ£, das de hoje.", author: null, category: "corpo" },
  ];
  await db.insert(quotes).values(items);
  console.log(`OK ${items.length} frases inseridas`);
}
main().catch((e) => { console.error(e); process.exit(1); });
