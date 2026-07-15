import { TOOLS } from "@/lib/types";
import { getApiKeyStatus } from "@/lib/integrations/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

export default function ToolsPage() {
  const apiStatus = getApiKeyStatus();

  const integratedTools = TOOLS.filter((t) => t.integrated);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Outils IA</h1>
        <p className="text-muted-foreground mt-1">
          Tous vos outils de création vidéo au même endroit
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle className="size-5 text-accent" />
          Tout est intégré à la plateforme
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integratedTools.map((tool) => {
            const isConnected =
              tool.id === "openai"
                ? apiStatus.openai
                : tool.id === "elevenlabs"
                  ? apiStatus.elevenlabs
                  : tool.id === "medvid-engine"
                    ? apiStatus.replicate
                    : tool.id === "heygen"
                      ? apiStatus.heygen
                      : false;

            return (
              <Card key={tool.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{tool.name}</CardTitle>
                    <Badge variant={isConnected ? "success" : "outline"}>
                      {isConnected ? "Connecté" : "Clé requise"}
                    </Badge>
                  </div>
                  <CardDescription>{tool.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {tool.description}
                  </p>
                  <Badge variant="secondary" className="mt-3 capitalize">
                    Étape : {tool.step}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow recommandé</CardTitle>
          <CardDescription>
            Pipeline complet pour une vidéo style tarbaland
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {[
              {
                step: "1",
                tool: "MedVid Studio",
                action: "Rédiger le script",
              },
              {
                step: "2",
                tool: "DALL·E (OpenAI)",
                action: "Générer le personnage 3D",
              },
              {
                step: "3",
                tool: "ElevenLabs",
                action: "Créer la voix FR",
              },
              {
                step: "4",
                tool: "HeyGen Avatar IV",
                action: "Animer + lip-sync",
              },
              {
                step: "5",
                tool: "MedVid Export",
                action: "Sous-titres + téléchargement MP4",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-lg border border-border p-4 text-center"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold mx-auto">
                  {item.step}
                </span>
                <p className="font-medium mt-3 text-sm">{item.tool}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.action}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
