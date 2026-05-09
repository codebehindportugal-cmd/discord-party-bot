import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { Badge, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Politica de Cookies | MordsFocas",
  description: "Informacao sobre cookies e tecnologias semelhantes usadas pelo MordsFocas."
};

const sections = [
  {
    title: "1. O que sao cookies",
    body: [
      "Cookies sao pequenos ficheiros guardados no navegador para permitir funcionalidades essenciais, manter sessoes, melhorar seguranca e compreender funcionamento tecnico do site.",
      "Tecnologias semelhantes, como armazenamento local ou identificadores tecnicos, podem cumprir funcoes equivalentes."
    ]
  },
  {
    title: "2. Cookies essenciais",
    body: [
      "Usamos cookies e mecanismos tecnicos essenciais para autenticar utilizadores, manter sessoes, proteger formularios e permitir o funcionamento normal do dashboard.",
      "Sem estes mecanismos, partes do site podem nao funcionar corretamente."
    ]
  },
  {
    title: "3. Cookies de pagamento e terceiros",
    body: [
      "Quando funcionalidades de pagamento estiverem ativas, prestadores externos como processadores de pagamento podem usar cookies ou tecnologias proprias para seguranca, prevencao de fraude e conclusao da transacao.",
      "Esses terceiros tratam dados de acordo com as suas proprias politicas."
    ]
  },
  {
    title: "4. Analitica e melhoria do servico",
    body: [
      "Se forem ativadas ferramentas de analitica, poderemos usar dados agregados para medir desempenho, erros, paginas usadas e qualidade do servico.",
      "Analitica nao essencial deve ser configurada de acordo com os requisitos de consentimento aplicaveis."
    ]
  },
  {
    title: "5. Como gerir cookies",
    body: [
      "Podes bloquear ou apagar cookies nas definicoes do navegador.",
      "Ao bloquear cookies essenciais, o login, dashboard, pagamentos ou outras funcionalidades autenticadas podem deixar de funcionar corretamente."
    ]
  },
  {
    title: "6. Alteracoes",
    body: [
      "Esta politica pode ser atualizada quando adicionarmos novas funcionalidades, prestadores externos ou mecanismos de analitica."
    ]
  }
];

export default function CookiesPage() {
  return (
    <div>
      <SiteNav />
      <main className="mx-auto max-w-4xl px-4 py-16 md:px-6">
        <Badge tone="discord">Legal</Badge>
        <SectionTitle
          title="Politica de Cookies"
          text="Como o MordsFocas usa cookies e tecnologias semelhantes no site e no dashboard."
        />
        <p className="mt-4 text-sm text-muted">Ultima atualizacao: 9 de maio de 2026</p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="border-t border-border pt-8">
              <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-4 border-t border-border pt-8 text-sm text-slate-300">
          <Link href="/terms" className="hover:text-white">Termos e Condicoes</Link>
          <Link href="/privacy" className="hover:text-white">Politica de Privacidade</Link>
        </div>
      </main>
    </div>
  );
}
