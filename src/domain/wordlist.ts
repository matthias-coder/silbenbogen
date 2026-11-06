import { makeWord } from './stage';
import type { Item } from './types';

const NOTATION = `
Ma-ma Mi-mi Li-sa Le-na Le-ni Lo-la Ni-na No-ra Ma-ra Mi-a Le-o To-ni Ti-na Ro-sa Na-se Ro-se Na-me No-te
To-ma-te Li-mo Me-lo-ne Sa-la-mi Mo-fa So-fa Ru-te To-re Mi-ne Si-lo So-lo Fo-to Fi-na-le O-ma E-mu U-fo
El-la An-na Em-ma Ot-to Af-fe En-te al-le El-fe Ar-me li-la Pa-pa O-pa Pu-ma Lu-pe Hu-pe Ho-se Ha-se Do-se
Da-me Do-mi-no Ba-na-ne Ra-be Tu-be Ka-me-ra Ki-no Ki-lo Ka-no-ne Pi-ra-te Ta-pe-te Ju-do Le-go Lo-go Sa-ge
We-ge Va-se E-va I-da Tü-te Kä-se Bü-ro Mö-we Lö-we Rü-be

Mut rot Tor Ton Tal Not Los Rat Mal Mus Nuss Fass Fell Sa-lat Mo-tor Tun-nel Ton-ne Son-ne Tan-te Tin-te
Tan-ne Tas-se Tor-te Sor-te Lis-te Nes-ter Mut-ter Mit-te Mot-te Rit-ter Mes-ser Som-mer Num-mer im-mer
Fal-te Sal-to Me-ter Li-ter Rol-ler Tel-ler Fil-ter Mus-ter Am-sel In-sel An-ton Mar-tin Si-mon Ro-man
Mo-nat Ra-sen E-sel Rol-le Fal-ter Fut-ter Fo-rel-le Ten-nis Ter-min Lot-te Sat-tel Ses-sel Bus Bad Rad Hut
Hof Zug Weg Tag Kuss Pass Ball Bett Mann Müll Tür Bär Wal Kä-fer Kof-fer Kel-ler Kis-te Kas-se Kat-ze Kan-ne
Kar-te Ker-ze Lam-pe Pup-pe Pal-me Wol-ke Wur-zel Win-ter Wet-ter Wes-pe Don-ner But-ter Bir-ne Bal-kon
Bag-ger Gar-ten Gur-ke Hüt-te Him-mel Ham-mer Zet-tel Zir-kus Tul-pe Tem-po Mas-ke Mon-tag Müt-ze Lip-pe
Lin-se Sil-be Sup-pe Ro-bo-ter Rät-sel Na-del Nu-del Ne-bel Ga-bel Ta-fel Löf-fel I-gel Ho-tel Ka-nal
Pin-sel Pu-del Re-gen Was-ser

Schu-le Scha-le Schaf Schal Schiff Fisch Tisch Busch Ta-sche Du-sche Kir-sche Mu-schel Schal-ter Schat-ten
Schul-ter Sche-re Schüs-sel Schau-kel Schei-be ich Dach Bach Buch Tuch Loch Koch Ku-chen Kü-che Wo-che
Sa-che la-chen ma-chen su-chen Be-cher Mäd-chen Ja-cke De-cke Lo-cke Mü-cke Bä-cker Zu-cker Sack Rock
Rü-cken Da-ckel Ei-mer Eis Rei-se Rei-fen Lei-ter Sei-fe Sei-te Seil Mei-se Rei-ter Bein Wein mein nein
ei-ne lei-se Teil Fei-er Reis Au-to Au-ge Maus Haus Laus Baum Raum Zaun Mau-er Bau-er lau-fen kau-fen
Tau-be Rau-pe Pau-se Lau-ne Maul faul laut Haut aus auf Eu-le Eu-ro Feu-er neu Heu heu-te Leu-te Beu-tel
teu-er Meu-te Mäu-se Häu-ser Bäu-me Läu-fer Räu-ber Tier Bie-ne Wie-se Lie-be Lied sie die wie viel
Zie-ge Rie-se Sieb sie-ben Fie-ber Ziel vier Mie-te Nie-re Tie-fe Qual-le Quel-le qua-ken

Blu-me Brot Stra-ße Bril-le Blatt Gras Glas Kleid klein Kran Kro-ne Kro-ko-dil Frau Freund Frosch Flö-te
Flie-ge Fla-sche Flag-ge Trep-pe Trau-be Trom-mel Traum Tram-po-lin Dra-che drei Pflan-ze Pferd Preis
Prinz Plan Platz Spa-ten Spiel Spin-ne Spie-gel Spur Spaß Stein Stern Stift Stier Stall Stoff Stun-de
Strand Strumpf Schne-cke Schnul-ler Schlüs-sel Schlit-ten Schrau-be Schwan Schwein Schwes-ter schwarz
Hund Hand Sand Land Wand Mund Kind Wind Bild Geld Feld Wald Wolf Milch Saft Luft Heft Gift Nest Rest Fest
Post Mist Ast Kopf Topf Zopf Herz Salz Pilz Holz Fens-ter Mons-ter El-tern Os-tern Turm Wurm Arm warm Film
Helm Zelt Welt kalt alt Gold wild bunt E-le-fant Mo-ment Wurst Durst Park Zwerg Berg Burg Korb Kern Horn
Dorf Wort Ort Art Bart Sport Start Lift Flos-se Tre-sor Tritt Trost Frost Stirn Stel-le Stil Stim-me
Strom Senf Samt Amt elf Mast Lust Last List Rost Test Flur Flut Flam-me
`;

export const WORDS: Item[] = NOTATION.trim().split(/\s+/).map(makeWord);
