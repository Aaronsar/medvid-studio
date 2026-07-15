import { getApiKeyStatus } from "@/lib/integrations/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Key } from "lucide-react";

export default function SettingsPage() {
  const apiStatus = getApiKeyStatus();

  const apis = [
    {
      name: "OpenAI",
      envVar: "OPENAI_API_KEY",
      description: "Génération d'images DALL·E 3 pour les personnages 3D",
      connected: apiStatus.openai,
      url: "https://platform.openai.com/api-keys",
      pricing: "~0.04€/image",
    },
    {
      name: "ElevenLabs",
      envVar: "ELEVENLABS_API_KEY",
      description: "Synthèse vocale française naturelle pour la narration",
      connected: apiStatus.elevenlabs,
      url: "https://elevenlabs.io/app/settings/api-keys",
      pricing: "Gratuit limité, puis ~5€/mois",
    },
    {
      name: "MedVid Engine",
      envVar: "REPLICATE_API_TOKEN",
      description: "Notre moteur lip-sync (Kling Avatar V2 + MEMO) — remplace HeyGen",
      connected: apiStatus.replicate,
      url: "https://replicate.com/account/api-tokens",
      pricing: "~1–2 $/vidéo cartoon — ajoutez une carte sur replicate.com/account/billing",
    },
    {
      name: "HeyGen (optionnel)",
      envVar: "HEYGEN_API_KEY",
      description: "Référence qualité externe — seulement si ANIMATION_PROVIDER=heygen",
      connected: apiStatus.heygen,
      url: "https://app.heygen.com/settings?nav=API",
      pricing: "~4–5 $/min — non requis",
    },
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground mt-1">
          Configurez vos clés API pour activer les intégrations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="size-5" />
            Configuration des clés API
          </CardTitle>
          <CardDescription>
            Créez un fichier <code className="text-primary">.env</code> à la
            racine du projet avec vos clés
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {apis.map((api) => (
            <div
              key={api.name}
              className="rounded-lg border border-border p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{api.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {api.description}
                  </p>
                </div>
                {api.connected ? (
                  <Badge variant="success" className="gap-1 shrink-0">
                    <CheckCircle className="size-3" />
                    Connecté
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 shrink-0">
                    <XCircle className="size-3" />
                    Non configuré
                  </Badge>
                )}
              </div>
              <div className="rounded-md bg-secondary/50 p-3 font-mono text-xs">
                {api.envVar}=votre_cle_ici
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <a
                  href={api.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Obtenir une clé →
                </a>
                <span>{api.pricing}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exemple de fichier .env</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="rounded-lg bg-secondary/50 p-4 text-xs font-mono overflow-x-auto">
{`# Copiez ce fichier en .env et remplissez vos clés
HEYGEN_API_KEY=hg_xxxxxxxx
ELEVENLABS_API_KEY=sk_xxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxx
REPLICATE_API_TOKEN=r8_xxxxxxxx`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mode démo</CardTitle>
          <CardDescription>
            Sans clés API, la plateforme fonctionne en mode démo
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Vous pouvez créer des projets, rédiger des scripts et parcourir
            tout le workflow sans clés API.
          </p>
          <p>
            Les étapes de génération (personnage, voix, animation) afficheront
            des placeholders et des messages indiquant comment activer les vraies
            intégrations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
