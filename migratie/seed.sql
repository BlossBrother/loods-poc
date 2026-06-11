-- seed.sql — herstelde data (telefoon-cache + personeelslijst), 43 medewerkers + 2 nieuws

-- Medewerkers
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0001','Anke Fischer','anke.fischer@fresh-forward.nl','Medewerker','Research and Apple Development','1900-02-12',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0002','Anne van Laar','anne.vanlaar@fresh-forward.nl','Medewerker',NULL,'1900-10-15',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0003','Arjan de Bruine','arjan.debruine@fresh-forward.nl','Medewerker',NULL,'1900-01-26',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0004','Barry de Vries','barry.devries@fresh-forward.nl','Medewerker','Field Employee','1900-11-08',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0005','Bert Meulenbroek','bert.meulenbroek@fresh-forward.nl','Medewerker','Manager Breeding','1900-11-16',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0006','Carina van der Lippe','carina.vanderlippe@fresh-forward.nl','Beheerder','HR & organisatie','1900-09-16',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0007','Evert Walraven','evert.walraven@fresh-forward.nl','Medewerker','Breeder apple','1900-01-14',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0008','Florian Szetyanszki',NULL,'Medewerker',NULL,'1900-03-16',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0009','Frank Leenders','frank.leenders@fresh-forward.nl','Medewerker',NULL,'1900-04-04',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0010','Gerwin Peters','gerwin.peters@fresh-forward.nl','Medewerker','Head of Cultivation','1900-12-03',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0011','Ilja Berendsen-van der Woude','ilja.berendsen@fresh-forward.nl','Medewerker','Financieel / HR','1900-06-21',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0012','Imke van Asseldonk-van den Hoven','imke.vandenhoven@fresh-forward.nl','Medewerker','Breeding Assistant','1900-06-15',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0013','Ingrid van der Bogt','ingrid.vanderbogt@fresh-forward.nl','Medewerker','License & Marketing','1900-08-16',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0014','Jack de Raadt','jack.raadt@fresh-forward.nl','Medewerker','Senior Field Employee','1900-06-04',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0015','Jan van Loenen','jan.vanloenen@fresh-forward.nl','Medewerker','Field Employee','1900-08-09',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0016','Janneke Goets','janneke.goets@fresh-forward.nl','Medewerker','Field Employee','1900-09-03',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0017','Jiahui Lin','lin.jiahui@fresh-forward.nl','Medewerker','Digital Phytopathologist','1900-12-23',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0018','Joanna Pabiniak','joanna.pabiniak@fresh-forward.nl','Medewerker','Manager Concepts','1900-03-05',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0019','Johan Willemsen','johan.willemsen@fresh-forward.nl','Medewerker','Bioinformatician','1900-07-21',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0020','Kees van Miltenburg','kees.vanmiltenburg@fresh-forward.nl','Medewerker','Farm Manager','1900-03-27',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0021','Lucie Bartels','lucie.bartels@fresh-forward.nl','Medewerker','Financial Administrator','1900-06-29',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0022','Maarten Schrijver','maarten.schrijver@fresh-forward.nl','Medewerker',NULL,'1900-01-08',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0023','Marina Gomez-Caro Gonzalez','marina.gomezcaro@fresh-forward.nl','Medewerker','Assistant Breeder','1900-08-14',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0024','Mikel Sponselee','mikel.sponselee@fresh-forward.nl','Medewerker',NULL,'1900-07-29',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0025','Monika Zbiega','monika.zbiega@fresh-forward.nl','Medewerker',NULL,'1900-10-23',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0026','Nick Howard','nick.howard@fresh-forward.nl','Medewerker','Molecular Breeder apple','1900-06-16',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0027','Peter-Jan van Ingen','peterjan.vaningen@fresh-forward.nl','Beheerder','Concept Developer','1900-07-15',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0028','Rene Janssen','rene.janssen@fresh-forward.nl','Medewerker',NULL,'1900-09-30',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0029','Rian Zegers-Peters','rian.zegers@fresh-forward.nl','Medewerker','Phytopathologist','1900-09-22',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0030','Rob d''Hont','rob.dhont@fresh-forward.nl','Medewerker','Breeder','1900-05-09',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0031','Robert Hooftman','robert.hooftman@fresh-forward.nl','Medewerker','Junior Marketing Coordinator','1900-08-09',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0032','Rogier Weel','rogier.weel@fresh-forward.nl','Medewerker',NULL,'1900-09-22',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0033','Rosalien Ederveen-Hoogakker','rosalien.ederveen@fresh-forward.nl','Medewerker',NULL,'1900-06-14',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0034','Ruud Venner','ruud.venner@fresh-forward.nl','Medewerker','Product Developer','1900-10-24',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0035','Saskia van Vulpen','saskia.vanvulpen@fresh-forward.nl','Medewerker','Breeding Assistant','1900-02-07',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0036','Stanley van Kuilenburg','stanley.vankuilenburg@fresh-forward.nl','Medewerker','Head of Cultivation','1900-09-18',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0037','Stephan Geerlings','stephan.geerlings@fresh-forward.nl','Medewerker','Marketing Manager','1900-05-04',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0038','Sylwia Swierczek','sylwia.swierczek@fresh-forward.nl','Medewerker',NULL,'1900-12-28',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0039','Teunis Sikma','teunis.sikma@fresh-forward.nl','Medewerker','Managing Director','1900-12-11',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0040','Thijs van Dijk','thijs.vandijk@fresh-forward.nl','Medewerker','Molecular Breeder','1900-01-29',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0041','Tim Koorevaar','timkoorevaar@fresh-forward.nl','Medewerker','Junior Molecular Breeder','1900-10-15',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0042','Wendelien de Graaf','wendelien.bast@fresh-forward.nl','Medewerker','Assistant Breeding','1900-06-07',1,'2026-06-05T14:55:03Z');
INSERT INTO medewerkers (id,naam,email,rol,functie,verjaardag,actief,created_at) VALUES ('rmw0043','Yanning Wang','yanning.wang@fresh-forward.nl','Medewerker','Breeding / IP / Marketing Assistant','1900-01-07',1,'2026-06-05T14:55:03Z');

-- Nieuws
INSERT INTO nieuws (id,titel,inhoud,categorie,publicatiedatum,status,uitgelicht,created_at) VALUES ('rnws0001','Fresh League WK Poule','Beste collega''s,

Na veelvuldig vragen, aandringen, subtiele hints en waarschijnlijk ook een beetje groepsdruk is het eindelijk zover: de Fresh League WK 2026-poule staat online! 🎉

Denk jij beter te weten dan bondscoaches, analisten en Teunis wie er wereldkampioen wordt? Dan is dit je kans om het te bewijzen.

Via onderstaande link kun je direct deelnemen aan onze Scorito-poule:

👉 Fresh League WK 2026
https://www.scorito.com/subleague/1170117/wk-voetbal-2026/fresh-league/836a2693-8451-439c-85f5-338063c8b024','Algemeen','2026-06-04','Gepubliceerd',1,'2026-06-05T14:55:03Z');
INSERT INTO nieuws (id,titel,inhoud,categorie,publicatiedatum,status,uitgelicht,created_at) VALUES ('rnws0002','🔥 Fresh BBQ 2026 – Save the Date! 🔥','De dagen worden langer, de zon laat zich weer zien en de drankjes liggen straks heerlijk koud... Dat kan maar één ding betekenen: tijd voor de jaarlijkse Fresh BBQ! 🍔🌭🍻

📅 Wanneer?
Vrijdag 3 juli 2026

Een mooie gelegenheid om samen het glas te heffen, bij te praten met collega''s en te genieten van lekker eten, gezelligheid en hopelijk een heerlijke zomeravond. 🌞😎

🍖 Heerlijke barbecuegerechten
🥗 Smakelijke salades en bijgerechten
🍺 Verfrissende drankjes
🎉 Gezelligheid met collega''s

👉 Laat via het prikbord weten of je erbij bent, zodat we voldoende eten en drinken kunnen regelen.','Evenement','2026-06-04','Gepubliceerd',0,'2026-06-05T14:55:03Z');

