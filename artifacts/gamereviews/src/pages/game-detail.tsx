import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import gamesData from "@/data/games.json";
import { useGameReviews } from "@/hooks/use-game-reviews";
import { useList, ListStatus } from "@/hooks/use-list";
import { useUser } from "@/hooks/use-user";
import { usePlan } from "@/hooks/use-plan";
import { useUpgradeModal } from "@/components/upgrade-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Stars } from "@/components/stars";
import { AiAnalysis } from "@/components/ai-analysis";
import { GameCard } from "@/components/game-card";
import { GameImage } from "@/components/game-image";
import { DealsSection } from "@/components/deals-section";
import { PriceAlertButton } from "@/components/price-alert-button";
import {
  Calendar, Monitor, Tag, ThumbsUp, Trash2, Shield, Star,
  MessageSquare, Share2, ShoppingCart, Loader2
} from "lucide-react";
import { motion } from "framer-motion";

const STORE_CONFIG: Record<string, { name: string; bg: string; text: string }> = {
  steam:       { name: "Steam",             bg: "#1b2838", text: "#c7d5e0" },
  playstation: { name: "PlayStation Store", bg: "#003087", text: "#ffffff" },
  xbox:        { name: "Xbox Store",        bg: "#107C10", text: "#ffffff" },
  nintendo:    { name: "Nintendo eShop",    bg: "#E4000F", text: "#ffffff" },
  epic:        { name: "Epic Games",        bg: "#2a2a2a", text: "#ffffff" },
  microsoft:   { name: "Microsoft Store",   bg: "#0078d4", text: "#ffffff" },
};

const PLATFORMS = ["PC", "PS5", "PS4", "Xbox Series X", "Xbox One", "Nintendo Switch", "Otro"];

export default function GameDetail() {
  const { id } = useParams();
  const gameId = parseInt(id || "0", 10);
  const game = gamesData.find((g) => g.id === gameId);

  const { user } = useUser();
  const { list, addToList, updateItem, removeFromList } = useList();
  const { canWriteReview, canAddToList } = usePlan();
  const { triggerUpgrade } = useUpgradeModal();

  const {
    reviews: gameReviews,
    loading: reviewsLoading,
    addReview,
    deleteReview,
    voteReview,
    hasVoted,
    reviewsWithOwnership,
  } = useGameReviews(gameId, game?.nombre ?? "");

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [recommended, setRecommended] = useState(true);
  const [reviewPlatform, setReviewPlatform] = useState("PC");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!game) return;
    try {
      const raw = localStorage.getItem("gr_visitas");
      const visitas = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      visitas[String(game.id)] = (visitas[String(game.id)] || 0) + 1;
      localStorage.setItem("gr_visitas", JSON.stringify(visitas));
    } catch {
      /* localStorage may be unavailable */
    }
  }, [game]);

  const handleShareReview = async (autor: string, texto: string, ratingValue: number) => {
    const shareText = `${autor} le dio ${ratingValue}/5 a ${game?.nombre}: "${texto.slice(0, 120)}${texto.length > 120 ? "…" : ""}"`;
    const shareData = {
      title: `Reseña de ${game?.nombre} en GameReviews`,
      text: shareText,
      url: typeof window !== "undefined" ? window.location.href : "",
    };
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      /* user cancelled or share failed */
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareData.url}`);
      toast.success("Reseña copiada al portapapeles");
    } catch {
      toast.error("No se pudo compartir la reseña");
    }
  };

  if (!game) {
    return (
      <div className="text-center py-20">
        <h2 className="text-3xl font-display font-bold mb-4">Juego no encontrado</h2>
        <Link href="/">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    );
  }

  const displayedReviews = reviewsWithOwnership(user?.nombre);
  const avgRating =
    gameReviews.length > 0
      ? gameReviews.reduce((acc, r) => acc + r.rating, 0) / gameReviews.length
      : game.rating;

  const listItem = list.find((i) => i.juegoId === game.id);
  const inList = !!listItem;

  const handleListChange = (val: string) => {
    if (val === "none") {
      removeFromList(game.id);
      toast("Juego eliminado de tu lista");
    } else {
      if (inList) {
        updateItem(game.id, { estado: val as ListStatus });
        toast.success("Estado actualizado");
      } else {
        if (!canAddToList()) {
          triggerUpgrade(
            "Límite de juegos alcanzado",
            "Con el plan Gratis puedes añadir hasta 10 juegos a tu lista. Hazte PRO para tener una lista ilimitada."
          );
          return;
        }
        addToList(game.id, val as ListStatus);
        toast.success("Añadido a tu lista");
      }
    }
  };

  const handlePublishReview = async () => {
    if (!user) {
      toast.error("Debes tener un nombre de usuario para publicar");
      return;
    }
    if (!canWriteReview()) {
      triggerUpgrade(
        "Límite de reseñas alcanzado",
        "Con el plan Gratis puedes escribir 5 reseñas por mes. Hazte PRO para escribir sin límites.",
        "pro"
      );
      return;
    }
    if (rating === 0) {
      toast.error("Por favor, selecciona una calificación");
      return;
    }
    if (reviewText.length < 50) {
      toast.error(`La reseña debe tener al menos 50 caracteres (faltan ${50 - reviewText.length})`);
      return;
    }

    try {
      setSubmitting(true);
      await addReview({
        autor: user.nombre,
        rating,
        texto: reviewText,
        recomendado: recommended,
        plataforma: reviewPlatform,
      });
      setRating(0);
      setReviewText("");
      setRecommended(true);
      setReviewPlatform("PC");
      toast.success("¡Reseña publicada con éxito!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al publicar la reseña");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (reviewId: string) => {
    const userHash = user?.nombre ?? "anonimo";
    const voted = await voteReview(reviewId, userHash);
    if (voted) {
      toast.success("Voto registrado");
    } else {
      toast("Ya has votado esta reseña");
    }
  };

  const handleDeleteReview = async (reviewId: string, autor: string) => {
    try {
      await deleteReview(reviewId, autor);
      toast("Reseña eliminada");
    } catch {
      toast.error("No se pudo eliminar la reseña");
    }
  };

  const similarGames = gamesData
    .filter((g) => g.id !== game.id && g.generos.some((gen) => game.generos.includes(gen)))
    .slice(0, 4);

  const purchaseEntries = Object.entries(
    ((game as unknown) as { enlacesCompra?: Record<string, string | null | undefined> }).enlacesCompra ?? {}
  ).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0);

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Banner */}
      <div className="relative -mt-8 -mx-4 md:-mx-8 h-[50vh] min-h-[400px] bg-background overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center blur-sm scale-110 opacity-30"
          style={{ backgroundImage: `url(${game.imagenBanner || game.imagen})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

        <div className="container relative h-full flex flex-col md:flex-row items-end pb-8 gap-8 px-4 md:px-8 mx-auto max-w-7xl z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-48 md:w-64 aspect-[3/4] rounded-xl shadow-2xl border-2 border-primary/20 bg-background overflow-hidden hidden md:block"
          >
            <GameImage
              src={game.imagen}
              alt={game.nombre}
              fallbackTitle={game.nombre}
              loading="eager"
              className="w-full h-full object-cover"
            />
          </motion.div>

          <div className="flex-1 space-y-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex flex-wrap gap-2 mb-3">
                {game.generos.map((g: string) => (
                  <Badge key={g} variant="secondary" className="bg-primary/20 text-primary border-primary/30 uppercase">
                    {g}
                  </Badge>
                ))}
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-black leading-tight text-foreground shadow-black drop-shadow-md">
                {game.nombre}
              </h1>
              <p className="text-xl text-muted-foreground mt-2 max-w-3xl">{game.descripcionCorta}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center gap-6 pt-4"
            >
              <div className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground font-bold rounded-lg px-3 py-2 text-xl flex items-center gap-2">
                  <Star className="h-5 w-5 fill-current" />
                  {avgRating.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>Comunidad</div>
                  <div>({gameReviews.length} reseñas)</div>
                </div>
              </div>

              <div className="h-10 w-px bg-border/50" />

              <div className="flex items-center gap-2">
                <div className="bg-muted text-foreground font-bold rounded-lg px-3 py-2 text-xl">
                  {game.ratingMetacritic}
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>Metacritic</div>
                  <div>(Crítica)</div>
                </div>
              </div>

              <div className="h-10 w-px bg-border/50 hidden sm:block" />

              <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0 flex-wrap">
                <Select value={inList ? listItem.estado : "none"} onValueChange={handleListChange}>
                  <SelectTrigger
                    className={`w-[200px] font-bold ${inList ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}
                  >
                    <SelectValue placeholder="Añadir a mi lista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No en lista</SelectItem>
                    <SelectItem value="quiero_jugar">Quiero Jugar</SelectItem>
                    <SelectItem value="jugando">Jugando</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                    <SelectItem value="abandonado">Abandonado</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  className="font-bold border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => {
                    document.getElementById("review-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Opinar
                </Button>
                <PriceAlertButton juegoId={game.id} nombreJuego={game.nombre} />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Video */}
        <div className="lg:col-span-2 space-y-8">
          <DealsSection nombre={game.nombre} gameId={game.slug} />

          <section className="bg-card border border-border p-6 rounded-2xl">
            <h3 className="text-2xl font-display font-bold mb-4">Acerca del juego</h3>
            <p className="text-foreground/80 leading-relaxed text-lg">{game.descripcion}</p>
          </section>

          {/* Purchase Links */}
          {purchaseEntries.length > 0 && (
            <section className="bg-card border border-border p-6 rounded-2xl">
              <h3 className="text-2xl font-display font-bold mb-5 flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-primary" />
                ¿Dónde comprarlo?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {purchaseEntries.map(([tienda, url]) => {
                  const cfg = STORE_CONFIG[tienda];
                  return (
                    <a
                      key={tienda}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all hover:-translate-y-0.5 hover:opacity-90 border border-white/10 text-sm"
                      style={{
                        backgroundColor: cfg?.bg ?? "#333",
                        color: cfg?.text ?? "#fff",
                      }}
                    >
                      <span className="flex-1">{cfg?.name ?? tienda}</span>
                      <span className="text-xs opacity-70">Ver oferta →</span>
                    </a>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3 w-3" />
                GameReviews no vende juegos. Los enlaces te redirigen a las tiendas oficiales.
              </p>
            </section>
          )}

          {game.video && (
            <section className="rounded-2xl overflow-hidden border border-border bg-black aspect-video relative">
              <iframe
                src={game.video}
                title="Trailer"
                className="absolute inset-0 w-full h-full"
                allowFullScreen
              />
            </section>
          )}

          <AiAnalysis
            systemPrompt="Eres un crítico de videojuegos experto, elocuente y ligeramente sarcástico. Analizas juegos con profundidad técnica y artística."
            userPrompt={`Escribe un análisis crítico breve pero profundo sobre el juego "${game.nombre}". Menciona sus puntos fuertes, debilidades, y si su nota en Metacritic de ${game.ratingMetacritic} es merecida. Usa formato Markdown, separa en párrafos, y dale un título llamativo.`}
          />

          {/* Reviews Section */}
          <section id="review-section" className="space-y-6 pt-8 border-t border-border">
            <h3 className="text-3xl font-display font-bold flex items-center gap-3">
              Reseñas de la Comunidad
              <Badge variant="secondary" className="text-lg">
                {gameReviews.length}
              </Badge>
            </h3>

            {/* Review Form */}
            <Card className="bg-card/50 border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent" />
              <CardContent className="p-6 space-y-4 pt-8">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback style={{ backgroundColor: user?.avatarColor }}>
                      {user?.nombre?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold">{user?.nombre ?? "Jugador"}</div>
                    <div className="text-xs text-muted-foreground">Tu opinión importa</div>
                  </div>
                  <div className="ml-auto flex items-center gap-2 bg-background p-2 rounded-lg border border-border">
                    <span className="text-sm font-bold mr-2">Nota:</span>
                    <Stars rating={rating} onRating={setRating} interactive max={5} className="scale-125" />
                  </div>
                </div>

                <Textarea
                  placeholder="¿Qué te pareció el juego? Escribe al menos 50 caracteres..."
                  className="min-h-[120px] resize-y bg-background text-lg"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recommend"
                      checked={recommended}
                      onCheckedChange={(c) => setRecommended(!!c)}
                    />
                    <label
                      htmlFor="recommend"
                      className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1"
                    >
                      <Shield className="h-4 w-4 text-primary" /> Lo recomiendo
                    </label>
                  </div>

                  <Select value={reviewPlatform} onValueChange={setReviewPlatform}>
                    <SelectTrigger className="w-[180px] bg-background h-8 text-sm">
                      <Monitor className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="ml-auto flex items-center gap-4">
                    <span
                      className={`text-xs ${reviewText.length < 50 ? "text-destructive" : "text-green-500"}`}
                    >
                      {reviewText.length}/50
                    </span>
                    <Button onClick={handlePublishReview} className="font-bold" disabled={submitting}>
                      {submitting ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Publicando...</>
                      ) : (
                        "Publicar Reseña"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review List */}
            <div className="space-y-4 mt-8">
              {reviewsLoading ? (
                <div className="text-center py-12 flex items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Cargando reseñas…
                </div>
              ) : displayedReviews.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border border-dashed">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-lg text-muted-foreground">Sé el primero en dar tu opinión.</p>
                </div>
              ) : (
                [...displayedReviews]
                  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                  .map((review) => (
                    <Card key={review.id} className="bg-card border-border">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/20 text-primary border border-primary/50">
                                {review.autor.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-bold flex items-center gap-2 flex-wrap">
                                {review.autor}
                                {review.recomendado && (
                                  <Badge
                                    variant="outline"
                                    className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] px-1 py-0 h-5"
                                  >
                                    Recomendado
                                  </Badge>
                                )}
                                {review.plataforma && review.plataforma !== "PC" && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5">
                                    {review.plataforma}
                                  </Badge>
                                )}
                                {review.plataforma === "PC" && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5">
                                    PC
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(review.fecha).toLocaleDateString("es-ES", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </div>
                            </div>
                          </div>
                          <Stars rating={review.rating} />
                        </div>

                        <p className="text-foreground/90 whitespace-pre-wrap">{review.texto}</p>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`gap-2 ${hasVoted(review.id) ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
                              onClick={() => void handleVote(review.id)}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              Útil ({review.utilidad})
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 text-muted-foreground"
                              onClick={() => void handleShareReview(review.autor, review.texto, review.rating)}
                            >
                              <Share2 className="h-4 w-4" />
                              Compartir
                            </Button>
                          </div>

                          {review.esPropia && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => void handleDeleteReview(review.id, review.autor)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Info & Similar */}
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Lanzamiento
                </span>
                <span className="font-medium text-right">
                  {new Date(game.fechaLanzamiento).toLocaleDateString("es-ES")}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Monitor className="h-4 w-4" /> Desarrollador
                </span>
                <span className="font-medium text-right">{game.desarrollador}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Tag className="h-4 w-4" /> Precio
                </span>
                <span className="font-bold text-primary text-right">${game.precio}</span>
              </div>
              <div className="pt-2">
                <span className="text-muted-foreground block mb-2 text-sm">Plataformas</span>
                <div className="flex flex-wrap gap-2">
                  {game.plataformas.map((p: string) => (
                    <Badge key={p} variant="secondary">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="pt-2">
                <span className="text-muted-foreground block mb-2 text-sm">Tags</span>
                <div className="flex flex-wrap gap-1">
                  {game.tags.map((t: string) => (
                    <span
                      key={t}
                      className="text-xs bg-background border border-border px-2 py-1 rounded-md text-muted-foreground"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {game.skins && game.skins.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-display font-bold text-xl">Skins & DLCs</h4>
              <div className="grid grid-cols-2 gap-3">
                {game.skins.map((skin: { nombre: string; precio: number; imagen: string }, i: number) => (
                  <Card key={i} className="bg-card/50 border-border overflow-hidden">
                    <GameImage
                      src={skin.imagen}
                      alt={skin.nombre}
                      fallbackTitle={skin.nombre}
                      className="w-full h-24 object-cover"
                    />
                    <div className="p-2 text-center">
                      <div className="text-xs font-bold truncate">{skin.nombre}</div>
                      <div className="text-xs text-primary">${skin.precio}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 pt-4">
            <h4 className="font-display font-bold text-2xl">Juegos Similares</h4>
            <div className="flex flex-col gap-4">
              {similarGames.map((sg) => (
                <Link key={sg.id} href={`/juego/${sg.id}`}>
                  <Card className="bg-card/50 border-border hover:border-primary/50 transition-colors cursor-pointer overflow-hidden flex h-24">
                    <div className="w-16 h-full shrink-0 overflow-hidden">
                      <GameImage
                        src={sg.imagen}
                        alt={sg.nombre}
                        fallbackTitle={sg.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3 flex flex-col justify-center">
                      <div className="font-bold text-sm line-clamp-1">{sg.nombre}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {sg.generos.slice(0, 2).join(", ")}
                      </div>
                      <div className="text-xs font-bold text-primary mt-1">${sg.precio}</div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
