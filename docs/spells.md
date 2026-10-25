# Zauber, die in jedem Modus gelten

**Rückzug** (Reichweite 3, Wartezeit 300 Ticks)
- Kampagne: Deine Kreaturen und Imps um das gewählte Feld werden in den Thronsaal versetzt.
- Arena und Ludus: beendet den Kampf. Niemand geht verloren. Im Ludus zählt es als Niederlage ohne Tod (+2 Gold Trost), auch in einer Turnierrunde; die Runde ist nicht gewonnen.

**Berserk** (Reichweite 2, Wartezeit 200 Ticks)
- Betroffene Kreaturen kämpfen bis in den Tod: sie fliehen nicht und geben nicht auf. Dazu kommt ein Kampfbonus: Stärke ×1,35, Tempo ×1,15. In der Kampagne hält es 400 Ticks, in einem Kampf bis zu dessen Ende.
- **Imps:** Stehen Feinde im Thronsaal, werden alle Imps von selbst berserk (solange sie dort stehen). Im Ludus bekommt ein gerufener Imp (Schriftrolle „Imp rufen") sofort Berserk; er geht nach dem Kampf verloren.

**Schriftrollen im Ludus:** Rückzug 50 Gold, Berserk 35, Imp rufen 25 (Bücherei, Beute, Ereignisse), siehe `docs/ludus.md`.

Code: `spells.js` (Rückzug, Berserk, Imp-Berserk), Anbindung in `arena.js` (`arenaCast`) und `index.html` (Reiter „Zauber", `shouldFlee`).
