import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Heart,
  MessageCircleHeart,
  ShieldCheck,
  Phone,
  Lock,
  UsersRound,
  Clock,
  BadgeCheck,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useRef } from "react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({ component: Landing });

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const STEPS = [
  {
    num: "01",
    title: "Crie um espaço seguro",
    desc: "Cadastre-se anonimamente em segundos. Não pedimos seu nome real, foto ou qualquer dado sensível.",
    icon: Lock,
  },
  {
    num: "02",
    title: "Conecte-se com alguém",
    desc: "Entre na nossa sala de espera virtual. Um voluntário preparado e empático estará logo disponível para você.",
    icon: MessageCircleHeart,
  },
  {
    num: "03",
    title: "Fale no seu tempo",
    desc: "Sem julgamentos, sem diagnósticos. Apenas uma escuta ativa, acolhedora e cheia de carinho.",
    icon: Heart,
  },
];

const PILLARS = [
  {
    icon: Lock,
    title: "Sua identidade preservada",
    text: "Você escolhe o que quer compartilhar. Suas conversas são estritamente confidenciais e protegidas.",
  },
  {
    icon: ShieldCheck,
    title: "Voluntários preparados",
    text: "Nossa rede passa por treinamentos focados em empatia, escuta ativa e intervenção acolhedora.",
  },
  {
    icon: UsersRound,
    title: "Calor humano",
    text: "Aqui não há robôs respondendo. Você conversará com pessoas reais que genuinamente se importam.",
  },
];

const FAQS = [
  {
    q: "O VIDA+ substitui a terapia com um psicólogo?",
    a: "Não. Nós oferecemos um pronto-acolhimento emocional. Para acompanhamento, diagnóstico ou tratamento, é fundamental buscar um psicólogo ou psiquiatra.",
  },
  {
    q: "Meus dados ou conversas ficam salvos?",
    a: "Mantemos apenas o mínimo necessário para o sistema funcionar. Suas mensagens privadas não são armazenadas permanentemente e seu sigilo é nossa prioridade.",
  },
  {
    q: "Quanto custa usar o aplicativo?",
    a: "É 100% gratuito. O VIDA+ é um projeto de impacto social mantido pelo amor e dedicação de voluntários.",
  },
  {
    q: "Eu também quero ajudar. Posso ser voluntário?",
    a: "Com certeza! Ficaremos felices em ter você. O processo inclui um cadastro, uma análise da nossa equipe e um treinamento de escuta.",
  },
];

function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <PublicLayout>

      {/* ═══════════════════════════════════════════
          HERO — Solar Clean
      ═══════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden aurora-bg"
      >
        {/* Orbs dourados suaves */}
        <div
          className="orb"
          style={{
            width: "700px", height: "700px",
            top: "-20%", left: "-15%",
            background: "radial-gradient(circle, oklch(0.78 0.17 82 / 0.18) 0%, transparent 70%)",
          }}
        />
        <div
          className="orb"
          style={{
            width: "500px", height: "500px",
            top: "5%", right: "-10%",
            background: "radial-gradient(circle, oklch(0.72 0.14 42 / 0.14) 0%, transparent 70%)",
          }}
        />
        <div
          className="orb"
          style={{
            width: "600px", height: "350px",
            bottom: "-5%", left: "15%",
            background: "radial-gradient(ellipse, oklch(0.78 0.17 82 / 0.10) 0%, transparent 70%)",
          }}
        />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 mx-auto max-w-5xl px-6 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="inline-flex items-center gap-2 pill mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-primary font-medium">Voluntários disponíveis agora</span>
          </motion.div>

          {/* Título */}
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="font-display text-6xl font-bold tracking-tight text-balance text-foreground sm:text-7xl md:text-8xl lg:text-9xl leading-[0.92]"
          >
            Você não está{" "}
            <span className="gradient-text">sozinho.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed sm:text-xl"
          >
            O <strong className="text-foreground">VIDA+</strong> conecta você a voluntários treinados
            para uma conversa de escuta emocional anônima. Sem julgamentos, sem pressa, no seu próprio tempo.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link to="/cadastro">
              <Button
                size="lg"
                className="h-14 gap-3 px-9 text-base font-semibold rounded-full shadow-glow
                           bg-primary text-primary-foreground border-0
                           hover:scale-105 hover:opacity-90 transition-all duration-300"
              >
                Quero conversar agora
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/cadastro">
              <Button
                size="lg"
                variant="outline"
                className="h-14 gap-3 px-9 text-base font-medium rounded-full
                           border-border hover:bg-muted hover:border-primary/40
                           transition-all duration-300"
              >
                <Heart className="h-5 w-5 text-primary" />
                Quero ser voluntário
              </Button>
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground"
          >
            {[
              { icon: BadgeCheck, label: "100% Gratuito" },
              { icon: Lock, label: "Privacidade garantida" },
              { icon: Clock, label: "No seu ritmo" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Chat Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
          style={{ opacity: heroOpacity }}
          className="relative z-10 mt-16 mx-auto w-full max-w-md px-6"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          >
            <ChatMockup />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/40"
        >
          <span className="text-xs tracking-widest uppercase">Explorar</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          COMO FUNCIONA — Clean Timeline
      ═══════════════════════════════════════════ */}
      <section className="relative py-32">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="text-center mb-20"
          >
            <span className="pill mb-4 inline-flex">Como funciona</span>
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl text-foreground">
              Um caminho simples para o{" "}
              <span className="gradient-text">acolhimento</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
              Sabemos que pedir ajuda já exige muita energia. Por isso, simplificamos tudo para você.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="relative"
          >
            {/* Linha vertical */}
            <div className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-primary/40 via-accent/20 to-transparent hidden md:block" />

            <div className="space-y-10">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.num}
                  variants={fadeUp}
                  className="group relative flex gap-8 md:gap-12"
                >
                  {/* Ícone */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="relative z-10 h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20
                                  flex items-center justify-center
                                  group-hover:bg-primary group-hover:border-primary group-hover:scale-110 transition-all duration-300"
                    >
                      <step.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="absolute top-16 left-1/2 -translate-x-1/2 h-10 w-px bg-gradient-to-b from-border to-transparent md:hidden" />
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 pt-2">
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground/50">
                      Passo {step.num}
                    </span>
                    <h3 className="mt-1 text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-md">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PILARES — Cards Limpos
      ═══════════════════════════════════════════ */}
      <section className="relative py-28 bg-muted/30 border-y border-border/60">
        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <span className="pill mb-4 inline-flex">Nossos pilares</span>
            <h2 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Construído sobre{" "}
              <span className="gradient-text">confiança</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-3"
          >
            {PILLARS.map((p) => (
              <motion.div
                key={p.title}
                variants={fadeUp}
                className="group relative rounded-2xl p-8 bg-card border border-border/60
                           hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 cursor-default"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-6
                                group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <p.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">{p.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{p.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FAQ — Minimalista
      ═══════════════════════════════════════════ */}
      <section className="relative py-28">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="text-center mb-12">
              <span className="pill mb-4 inline-flex">Dúvidas frequentes</span>
              <h2 className="font-display text-4xl font-bold tracking-tight text-foreground">
                Suas perguntas,{" "}
                <span className="gradient-text">respondidas</span>
              </h2>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
              {FAQS.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={String(i)}
                  className="border border-border/60 rounded-2xl bg-card px-6 overflow-hidden
                             hover:border-primary/30 transition-colors data-[state=open]:border-primary/40"
                >
                  <AccordionTrigger className="text-left text-base font-semibold py-5 hover:text-primary transition-colors [&>svg]:text-primary">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground leading-relaxed pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA FINAL — Chamada Emocional Clean
      ═══════════════════════════════════════════ */}
      <section className="relative py-28">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative rounded-3xl overflow-hidden border border-primary/25 bg-primary/8 p-14 text-center"
          >
            {/* Orb decorativo */}
            <div
              className="orb"
              style={{
                width: "400px", height: "300px",
                top: "-40%", right: "-10%",
                background: "radial-gradient(circle, oklch(0.78 0.17 82 / 0.25) 0%, transparent 70%)",
                position: "absolute", filter: "blur(60px)", pointerEvents: "none", opacity: 0.7,
              }}
            />
            <div className="relative z-10">
              <Sparkles className="h-9 w-9 text-primary/50 mx-auto mb-6" />
              <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl text-balance">
                Hoje pode ser o primeiro passo para se sentir melhor.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
                Não existe hora certa para pedir ajuda. Você merece ser ouvido.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link to="/cadastro">
                  <Button
                    size="lg"
                    className="h-14 gap-3 px-9 text-base font-semibold rounded-full shadow-glow
                               bg-primary text-primary-foreground border-0
                               hover:scale-105 hover:opacity-90 transition-all duration-300"
                  >
                    Começar agora <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          EMERGÊNCIA — Faixa de Segurança
      ═══════════════════════════════════════════ */}
      <section className="border-t border-border/60 bg-muted/20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-6xl px-6 py-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Em situação de crise extrema?
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Ligue agora para o{" "}
                  <strong className="text-foreground">CVV 188</strong> (24h),{" "}
                  <strong className="text-foreground">SAMU 192</strong> ou vá ao pronto-socorro.
                </p>
              </div>
            </div>
            <Link to="/seguranca" className="shrink-0">
              <Button variant="outline" size="sm" className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/8">
                Recursos de segurança
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </PublicLayout>
  );
}

// ─── Chat Mockup ──────────────────────────────────────────────────────────────

function ChatMockup() {
  return (
    <div
      className="relative rounded-3xl overflow-hidden border border-border/60 bg-card shadow-soft"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
            <MessageCircleHeart className="h-5 w-5 text-primary" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-card" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Voluntário C.</p>
          <p className="text-xs text-emerald-500 font-medium">● online · pronto para acolher</p>
        </div>
        <div className="ml-auto flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
        </div>
      </div>

      {/* Mensagens */}
      <div className="px-5 py-5 space-y-4">
        <ChatBubble who="vol" delay={0.5}>
          Oi! Que bom que você está aqui. Como você está se sentindo hoje?
        </ChatBubble>
        <ChatBubble who="me" delay={1.5}>
          Tenho me sentido muito ansiosa essa semana, as coisas parecem pesadas…
        </ChatBubble>
        <ChatBubble who="vol" delay={2.5}>
          Eu imagino como deve estar sendo difícil. Estou aqui com você. Quer me contar mais?
        </ChatBubble>
      </div>

      {/* Input */}
      <div className="px-5 pb-5">
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3 border border-border bg-muted/30">
          <span className="flex-1 text-sm text-muted-foreground/50">Escreva o que está sentindo...</span>
          <span
            className="rounded-xl px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary"
          >
            Enviar
          </span>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  who,
  children,
  delay,
}: {
  who: "me" | "vol";
  children: React.ReactNode;
  delay: number;
}) {
  const isMe = who === "me";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isMe
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm text-foreground/80 border border-border bg-muted/40"
        }`}
      >
        {children}
      </div>
    </motion.div>
  );
}