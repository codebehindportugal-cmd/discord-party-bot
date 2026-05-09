import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { Badge, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Politica de Privacidade | Party Loot Bot",
  description: "Informacao sobre recolha, utilizacao e protecao de dados pessoais no Party Loot Bot."
};

const sections = [
  {
    title: "1. Responsavel pelo tratamento",
    body: [
      "O Party Loot Bot e uma plataforma para gestao de eventos, jogadores, loot e subscricoes associadas a servidores Discord.",
      "Responsavel: [NOME DA ENTIDADE OU PESSOA RESPONSAVEL]. Contacto: [EMAIL DE CONTACTO]. Antes da publicacao, substitui estes campos pelos dados legais corretos."
    ]
  },
  {
    title: "2. Dados que podemos recolher",
    body: [
      "Podemos tratar dados fornecidos diretamente pelo utilizador, como nome, email, palavra-passe protegida por hash e preferencias de conta.",
      "Quando o bot e usado num servidor Discord, podemos guardar identificadores Discord, nome de utilizador, servidor, jogo, classe, presencas em eventos, tempo em canais de voz, registos de loot e configuracoes administrativas.",
      "Se forem usadas subscricoes, podemos guardar estado do plano, identificadores de cliente/subscricao e referencias de pagamento. Os dados completos do cartao sao tratados pelo prestador de pagamentos, quando aplicavel."
    ]
  },
  {
    title: "3. Finalidades",
    body: [
      "Usamos os dados para operar o bot e o dashboard, autenticar utilizadores, gerir eventos, calcular divisoes de loot, aplicar limites de planos, prestar suporte, prevenir abuso e cumprir obrigacoes legais.",
      "Tambem podemos usar dados tecnicos e de atividade para manter a seguranca, diagnosticar erros e melhorar a fiabilidade do servico."
    ]
  },
  {
    title: "4. Fundamento juridico",
    body: [
      "O tratamento pode basear-se na execucao do servico solicitado, no interesse legitimo em manter a plataforma segura e funcional, no consentimento quando exigido, ou no cumprimento de obrigacoes legais."
    ]
  },
  {
    title: "5. Partilha de dados",
    body: [
      "Podemos recorrer a prestadores externos para alojamento, base de dados, autenticacao, pagamentos, email, analitica tecnica ou suporte operacional.",
      "Os dados tambem podem ser comunicados quando exista obrigacao legal, ordem de autoridade competente ou necessidade de proteger direitos, seguranca e integridade da plataforma."
    ]
  },
  {
    title: "6. Conservacao",
    body: [
      "Conservamos os dados durante o periodo necessario para prestar o servico, manter historicos de eventos e cumprir obrigacoes legais.",
      "O administrador de um servidor pode pedir a eliminacao ou exportacao de dados associados ao servidor, salvo quando exista obrigacao legitima de conservacao."
    ]
  },
  {
    title: "7. Direitos dos titulares",
    body: [
      "Nos termos aplicaveis, podes pedir acesso, retificacao, apagamento, limitacao, oposicao ao tratamento e portabilidade dos teus dados.",
      "Tambem podes retirar consentimento quando o tratamento dependa de consentimento. Para exercer direitos, usa o contacto indicado nesta pagina."
    ]
  },
  {
    title: "8. Seguranca",
    body: [
      "Aplicamos medidas tecnicas e organizativas razoaveis para proteger os dados, incluindo controlo de acesso, variaveis de ambiente para segredos, hashes de palavra-passe e restricao de chaves de API.",
      "Nenhum sistema e totalmente imune a incidentes. Em caso de violacao relevante, seguiremos os procedimentos legais aplicaveis."
    ]
  },
  {
    title: "9. Alteracoes",
    body: [
      "Esta politica pode ser atualizada para refletir alteracoes no servico, requisitos legais ou melhorias operacionais. A data de atualizacao sera revista quando houver mudancas relevantes."
    ]
  }
];

export default function PrivacyPage() {
  return (
    <div>
      <SiteNav />
      <main className="mx-auto max-w-4xl px-4 py-16 md:px-6">
        <Badge tone="discord">Legal</Badge>
        <SectionTitle
          title="Politica de Privacidade"
          text="Como o Party Loot Bot recolhe, usa e protege dados pessoais no dashboard e no bot Discord."
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
          <Link href="/cookies" className="hover:text-white">Politica de Cookies</Link>
        </div>
      </main>
    </div>
  );
}
