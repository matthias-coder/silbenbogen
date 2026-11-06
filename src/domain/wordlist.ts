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

Lu-na Li-na Mo-na Ti-mo Le-a Pi-a Ju-le Sa-ra La-ra Ja-na Mi-la Ne-le O-le I-na U-te U-do E-li E-le-na
La-ma Mu-li Di-no Ku-li Ki-wi Ta-xi He-xe Ni-xe La-va To-fu Tu-ba Ti-pi Ju-li Ju-ni Jo-jo Ka-ro Pu-te Ma-de Mo-de
Re-de Bu-de Bo-te Ga-be Lü-ge He-fe Ra-ke-te Ko-a-la O-li-ve
Mu-se-um Mi-nu-te Sa-fa-ri Ka-ka-du Ku-si-ne Ge-mü-se En-de Er-de In-fo Or-ka Al-ge Ol-ga Ul-la
El-le Ul-me Ar-no An-ja mü-de bö-se So-ße Fü-ße Sä-ge

der das den dem was wer wir mir dir hat hin her bin bis mit von vor für nur nun gut man mag kam
Lob Lok Pol Tat Wut Box Max Maß Fuß süß Fall Wall Zoll toll voll hell soll will dann wann kann denn wenn
Sinn Kinn dünn Lamm Kamm Damm Riff nass Riss Biss Bass muss nett satt matt
Va-ter Kin-der Na-men Wa-gen Bo-gen Bo-den Fa-den La-den Ha-fen O-fen Ha-ken Kü-ken Be-sen Ma-gen Re-gal Ka-bel
Na-bel Fa-bel He-bel Mö-bel Hü-gel Bü-gel Vo-gel Ke-gel Se-gel Re-gel Na-gel Ku-gel Ru-del Pe-dal Me-tall
Dok-tor Hu-mor Ti-ger Ha-fer U-fer Ho-nig Kö-nig we-nig Kä-fig Es-sig Ho-bel Ju-bel Ka-ter Pe-ter Fe-der Le-der
Ru-der Pu-der Ma-ler Wel-le Hal-le Wol-le Kel-le Hül-le Kap-pe Map-pe Pap-pe Rip-pe Wip-pe Wan-ne Hen-ne Rin-ne
Pan-ne Kam-mer Zim-mer Hum-mer Jam-mer Sem-mel Rum-mel Kom-ma Gum-mi Mut-ti Kis-sen Gas-se Nüs-se es-sen
mes-sen wis-sen müs-sen las-sen pas-sen Kes-sel Rüs-sel Bis-sen Tas-te Pis-te Wes-te Kas-ten Os-ten Wes-ten
Nor-den Sü-den Hus-ten Kas-per Os-kar Bit-te Mat-te Rat-te Lat-te Wat-te Tat-ze Hit-ze Kut-ter Ret-ter Git-ter
Gi-tar-re Kit-tel Mit-tel Ket-te Wet-te Hil-fe Sal-be Fal-ke Bal-ken Pil-ze Pul-ver Sil-ber Al-ter Wal-ter
Kar-ten war-ten Wor-te Kur-ve Tur-ner Kör-per Far-be Nar-be Kür-bis Mar-kus Mar-ta Wür-fel Kar-ton Bir-ke
Sor-ge Mor-gen Mar-ke Pum-pe Am-pel Wim-per Gän-se Hän-de Wän-de Län-der Rin-der hin-ter un-ter mun-ter Kan-te
Hun-de Wun-de Run-de Lin-de Rin-de Bin-de fin-den bin-den Sonn-tag Mit-tag Ok-to-ber No-vem-ber De-zem-ber
Sep-tem-ber Gi-raf-fe Del-fin Ad-ler Ka-mel Rob-be Ot-ter Bi-ber Ap-fel Kar-tof-fel Ka-rot-te Piz-za Müs-li
Te-le-fon Ran-zen Man-tel Gür-tel Pi-lot Pi-rat Sol-dat Mu-sik Pa-ket Mo-ni-tor Sa-xo-fon Le-xi-kon Mi-xer
Bo-xer Vul-kan Va-nil-le Pin-zet-te Me-di-zin Ma-ga-zin Wal-zer Jä-ger Jo-nas Jo-ker Ka-jak Küs-te zu-sam-men
le-sen ma-len ru-fen sa-gen ho-len ha-ben ge-ben le-ben lo-ben re-den ba-den ra-ten kom-men ren-nen kön-nen
wol-len sol-len fal-len hal-ten hel-fen wer-fen ler-nen tur-nen tan-zen sit-zen put-zen hof-fen bit-ten ret-ten
hö-ren ü-ben lus-tig mu-tig sal-zig fer-tig bit-ter je-der o-ben un-ten hin-ten vor-ne

Toch-ter Mitt-woch Tep-pich Kir-che Bu-che Ei-che Teich reich weich wach auch Bauch Rauch dick dich mich
sich doch noch nach euch ko-chen rie-chen rech-nen rich-tig wich-tig Zei-chen Häus-chen Mär-chen Ka-nin-chen
So-cke Ha-cke Lü-cke Ti-cket zu-rück Bock Na-cken pa-cken ba-cken we-cken We-cker Ho-cker
le-cker lo-cker schön schon Schein Schaum Schach Scheu-ne Schau-fel Schü-ler scha-de Scho-ko Tausch Fi-scher
wa-schen du-schen mi-schen na-schen Tu-sche Ma-sche Ei-sen Ei-le Ei-er fein dein sein kein weil Beil heiß weiß
Wei-se Wei-de Hei-de Sei-de bei-de Zeit weit Leim Reim Heim Keim Zei-le Mei-le Fei-le ei-len tei-len hei-len
Zei-ger Gei-ge Fei-ge zei-gen Gei-er Meis-ter hei-ter wei-ter kei-ne mei-ne dei-ne sei-ne Po-li-zei Pa-pa-gei
A-mei-se Ar-beit Wei-zen bei-ßen hei-ßen rei-ßen Saum kaum Tau Bau raus sau-er Dau-er Hau-fen tau-fen Gaul Laub
sau-ber Zau-ber Dau-men kau-en bau-en schau-en hau-en sau-sen au-ßen Zau-be-rer Au-to-mat Ur-laub ge-nau
Beu-le Keu-le Beu-te neun Zeu-ge Zeug Leuch-te Säu-le Zäu-ne läu-ten Ge-bäu-de tief lieb Dieb hier Kiel nie
Wie-ge Lie-ge Rie-gel Sie-gel Zie-gel Wie-sel Die-sel Kie-sel Rie-men Lie-der nie-der wie-der Mie-ter Kie-fer
Pa-pier lie-gen schie-ben lie-ben gie-ßen vie-le die-se die-ser Sie-ger Ko-pie Me-lo-die Ma-rie Quiz quer
be-quem

Bru-der Brü-cke Glo-cke Glück Stück Block blau grau braun grün gelb groß klug Gruß Kloß Floß Fleiß flei-ßig
Fluss Schloss Schluss Schlamm Schritt schnell Schnur Schna-bel Schmutz Schwamm schwer schlau schla-fen
schwim-men schrei-ben Schrift Schild Schirm Schatz Mensch Wunsch falsch frisch hübsch Fleisch Deutsch
Mond Hemd Hals Gans Keks Text Axt Arzt Herbst Kunst Obst jetzt acht Nacht Licht nicht recht rechts leicht
Frucht durch Storch Hirsch Blitz Witz Sitz Satz Netz Tanz ganz Kranz Schwanz Pelz stolz kurz März Sturz Kreuz
Zweig zwei zwölf fünf eins Knie Knopf Kno-chen Kno-ten Krebs Kraut Braut Kreis Brei Blei frei treu brav Brief
Trieb Stiel Stau Pfau Pfeil Pflau-me Pfan-ne Pfef-fer Pfüt-ze Pfo-te Zwie-bel Stie-fel Flie-ger Krei-de
Freu-de Träu-me Steu-er Kräu-ter drau-ßen tau-send Grü-ße Krö-te Kle-ber Klas-se Trak-tor
Spi-nat Kla-vier Au-gust Sams-tag Diens-tag Frei-tag Hams-ter
Bürs-te Pols-ter Erb-se Flug-zeug Hand-tuch Buch-sta-be Po-li-zist tref-fen plat-zen krat-zen
schwit-zen Schnit-zel Spit-ze spie-len flie-gen fra-gen tra-gen blei-ben brau-chen spre-chen klet-tern
bas-teln trau-rig tro-cken durs-tig ge-sund stark schwach hart rund dort
`;

export const WORDS: Item[] = NOTATION.trim().split(/\s+/).map(makeWord);
