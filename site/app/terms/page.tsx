import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { Badge, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Termos e Condicoes | Party Loot Bot",
  description: "Termos aplicaveis ao uso do Party Loot Bot, dashboard, subscricoes e funcionalidades Discord."
};

const sections = [
  {
    title: "1. Aceitacao dos termos",
    body: [
      "Ao usar o Party Loot Bot, o dashboard ou qualquer funcionalidade associada, aceitas estes Termos e Condicoes.",
      "Se usas o servico em nome de uma guild, comunidade ou servidor Discord, confirmas que tens autorizacao para configurar o bot e gerir os dados desse servidor."
    ]
  },
  {
    title: "2. Descricao do servico",
    body: [
      "O Party Loot Bot ajuda comunidades Discord a gerir eventos, inscricoes, tracking de voz, classes, planos, loot e splits.",
      "Algumas funcionalidades podem depender de permissoes Discord, disponibilidade da API Discord, configuracao correta do servidor, ligacao a base de dados e plano ativo."
    ]
  },
  {
    title: "3. Conta e seguranca",
    body: [
      "O utilizador e responsavel por manter credenciais, tokens, chaves de API e acessos administrativos em seguranca.",
      "Nao deves partilhar acessos administrativos com pessoas nao autorizadas nem tentar aceder a servidores, contas ou dados que nao te pertencem."
    ]
  },
  {
    title: "4. Uso aceitavel",
    body: [
      "Nao podes usar o servico para spam, abuso, fraude, violacao de direitos de terceiros, recolha indevida de dados ou atividades ilegais.",
      "Reservamo-nos o direito de limitar, suspender ou remover acesso quando exista abuso, risco de seguranca, incumprimento destes termos ou obrigacao legal."
    ]
  },
  {
    title: "5. Planos, pagamentos e alteracoes",
    body: [
      "Os planos Free, Pro e Premium podem ter limites diferentes de jogadores, eventos, jogos e funcionalidades.",
      "Precos, limites e funcionalidades podem ser alterados. Quando a alteracao afetar uma subscricao paga em curso, serao aplicadas as regras comunicadas no momento da alteracao ou renovacao.",
      "Pagamentos processados por prestadores externos ficam sujeitos tambem aos termos desses prestadores."
    ]
  },
  {
    title: "6. Disponibilidade",
    body: [
      "Procuramos manter o servico disponivel e funcional, mas nao garantimos funcionamento ininterrupto, livre de erros ou compativel com todas as alteracoes feitas por plataformas externas.",
      "Podem ocorrer manutencoes, falhas de alojamento, indisponibilidade da API Discord, problemas de rede ou interrupcoes de terceiros."
    ]
  },
  {
    title: "7. Dados e conteudos",
    body: [
      "Os administradores de servidores sao responsaveis pela configuracao do bot e pela legitimidade dos dados que introduzem ou sincronizam.",
      "Podemos remover ou limitar dados quando necessario para seguranca, cumprimento legal, correcao tecnica ou encerramento de conta/servidor."
    ]
  },
  {
    title: "8. Limitacao de responsabilidade",
    body: [
      "Na medida permitida por lei, o Party Loot Bot nao se responsabiliza por perdas indiretas, lucros cessantes, conflitos entre jogadores, erros de configuracao, decisoes administrativas de guilds ou indisponibilidade de servicos externos.",
      "O bot fornece calculos e ferramentas de apoio, mas a validacao final de eventos, loot e pagamentos internos cabe aos administradores do servidor."
    ]
  },
  {
    title: "9. Alteracoes aos termos",
    body: [
      "Estes termos podem ser atualizados para refletir alteracoes do servico, requisitos legais ou melhorias operacionais.",
      "A continuacao do uso do servico apos a publicacao de alteracoes constitui aceitacao dos termos revistos."
    ]
  },
  {
    title: "10. Contacto",
    body: [
      "Para questoes sobre estes termos, usa o contacto oficial do responsavel pelo servico: [EMAIL DE CONTACTO]."
    ]
  }
];

export default function TermsPage() {
  return (
    <div>
      <SiteNav />
      <main className="mx-auto max-w-4xl px-4 py-16 md:px-6">
        <Badge tone="discord">Legal</Badge>
        <SectionTitle
          title="Termos e Condicoes"
          text="Regras de utilizacao do Party Loot Bot, dashboard, planos e funcionalidades ligadas ao Discord."
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
          <Link href="/privacy" className="hover:text-white">Politica de Privacidade</Link>
          <Link href="/cookies" className="hover:text-white">Politica de Cookies</Link>
        </div>
      </main>
    </div>
  );
}
