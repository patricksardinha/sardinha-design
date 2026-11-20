import { useState } from "react";
import { cssVarName, type ThemeName } from "../scripts/tokens-lib.mjs";
import { Button, Card, Dialog, Input, Tag } from "../src/components";
import { groupOf, type Doc } from "./tokenModel";

const PANGRAM = "Portez ce vieux whisky au juge blond qui fume";

/** Une planche d'épreuve : tous les jetons et composants dans un thème. */
export function Preview({ theme, doc }: { theme: ThemeName; doc: Doc }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const colors = groupOf(doc, "color", theme);
  const fonts = groupOf(doc, "font");
  const sizes = groupOf(doc, "fontSize");
  const spaces = groupOf(doc, "space");
  const radii = groupOf(doc, "radius");
  const borders = groupOf(doc, "borderWidth");
  const shadows = groupOf(doc, "shadow");
  const durations = groupOf(doc, "duration");
  const emailError = email !== "" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? "Adresse incomplète : il manque « @ » ou le domaine." : undefined;
  const label = theme === "light" ? "Clair" : "Sombre";

  return (
    <article className="pv" data-theme={theme} aria-label={`Épreuve en thème ${label.toLowerCase()}`}>
      <header className="pv-head">
        <h2>{label}</h2>
        <code>data-theme="{theme}"</code>
      </header>

      <section className="pv-sec">
        <h3 className="pv-h">Couleurs</h3>
        <div className="pv-swatches">
          {Object.entries(colors).map(([name, value]) => (
            <div className="pv-swatch" key={name}>
              <span className="pv-swatch__chip" style={{ background: `var(${cssVarName("color", name)})` }} />
              <span className="pv-swatch__name">{name}</span>
              <code className="pv-swatch__value">{value}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="pv-sec">
        <h3 className="pv-h">Typographie</h3>
        {Object.entries(fonts).map(([name]) => (
          <p key={name} className="pv-font" style={{ fontFamily: `var(${cssVarName("font", name)})` }}>
            <span className="pv-meta">{name}</span> {PANGRAM}
          </p>
        ))}
        <div className="pv-sizes">
          {Object.entries(sizes).map(([name, value]) => (
            <p key={name} className="pv-size">
              <span className="pv-meta">
                {name} · {value}
              </span>
              <span style={{ fontSize: `var(${cssVarName("fontSize", name)})` }}>Sardinha</span>
            </p>
          ))}
        </div>
      </section>

      <section className="pv-sec">
        <h3 className="pv-h">Espacements</h3>
        {Object.entries(spaces).map(([name, value]) => (
          <div key={name} className="pv-bar-row">
            <span className="pv-meta">{name}</span>
            <span className="pv-bar" style={{ width: `var(${cssVarName("space", name)})` }} />
            <code className="pv-meta">{value}</code>
          </div>
        ))}
      </section>

      <section className="pv-sec pv-grid2">
        <div>
          <h3 className="pv-h">Arrondis</h3>
          <div className="pv-tiles">
            {Object.entries(radii).map(([name]) => (
              <div key={name} className="pv-radius" style={{ borderRadius: `var(${cssVarName("radius", name)})` }}>
                {name}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="pv-h">Bordures</h3>
          <div className="pv-tiles">
            {Object.entries(borders).map(([name]) => (
              <div key={name} className="pv-border" style={{ borderWidth: `var(${cssVarName("borderWidth", name)})` }}>
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pv-sec">
        <h3 className="pv-h">Ombres</h3>
        <div className="pv-tiles">
          {Object.entries(shadows).map(([name]) => (
            <div key={name} className="pv-shadow" style={{ boxShadow: `var(${cssVarName("shadow", name)})` }}>
              {name}
            </div>
          ))}
        </div>
      </section>

      <section className="pv-sec">
        <h3 className="pv-h">Durées</h3>
        {Object.entries(durations).map(([name, value]) => (
          <div key={name} className="pv-bar-row">
            <span className="pv-meta">{name}</span>
            <span className="pv-track">
              <span className="pv-runner" style={{ animationDuration: `var(${cssVarName("duration", name)})` }}>
                <span className="pv-ball" />
              </span>
            </span>
            <code className="pv-meta">{value}</code>
          </div>
        ))}
      </section>

      <section className="pv-sec">
        <h3 className="pv-h">Button</h3>
        <div className="pv-wrap">
          <Button>Primaire</Button>
          <Button variant="secondary">Secondaire</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Désactivé</Button>
        </div>
        <div className="pv-wrap">
          <Button size="sm">Petit</Button>
          <Button size="md" variant="secondary">
            Moyen
          </Button>
          <Button size="lg">Grand</Button>
        </div>
      </section>

      <section className="pv-sec">
        <h3 className="pv-h">Input</h3>
        <div className="pv-stack">
          <Input
            label="Adresse e-mail"
            type="email"
            placeholder="patricko@exemple.ch"
            hint="Tapez une adresse incomplète pour voir l'état d'erreur."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
          />
          <Input label="Nom du projet" defaultValue="sardinha" error="Ce nom est déjà pris." />
        </div>
      </section>

      <section className="pv-sec">
        <h3 className="pv-h">Card et Tag</h3>
        <Card
          title="Synchronisation"
          interactive
          footer={
            <>
              <Button size="sm">Ouvrir</Button>
              <Button size="sm" variant="secondary">
                Plus tard
              </Button>
            </>
          }
        >
          <p>Dernière sauvegarde il y a 3 minutes. Tout est à jour sur les trois appareils.</p>
          <div className="pv-wrap">
            <Tag variant="success">Succès</Tag>
            <Tag variant="warning">Alerte</Tag>
            <Tag variant="danger">Erreur</Tag>
            <Tag>Neutre</Tag>
          </div>
        </Card>
      </section>

      <section className="pv-sec">
        <h3 className="pv-h">Dialog</h3>
        <Button variant="secondary" onClick={() => setDialogOpen(true)} data-open-dialog={theme}>
          Ouvrir la fenêtre ({label.toLowerCase()})
        </Button>
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Supprimer le projet ?"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button variant="danger" onClick={() => setDialogOpen(false)}>
                Supprimer
              </Button>
            </>
          }
        >
          <p>
            Cette action est définitive. Le focus reste dans la fenêtre (Tab), Échap ou un clic sur le fond la ferment.
          </p>
          <Input label="Tapez le nom du projet pour confirmer" placeholder="sardinha" />
        </Dialog>
      </section>
    </article>
  );
}
