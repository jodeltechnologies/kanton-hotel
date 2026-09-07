-- =============================================================
-- Kanton Hotel — starting data (rooms taken from the price list
-- on the reception desk). Run after schema.sql.
-- =============================================================
insert into public.settings (id) values (1) on conflict (id) do nothing;

insert into public.rooms (number, name, category, price, floor, capacity, bed, description, amenities, photos) values
('101','Standard room','standard',13000,1,2,'1 queen bed','A quiet room on the ground floor with a queen bed, fresh linen daily and a work corner.',
  '{"Free unlimited internet","Smart TV","Air conditioning","Private bathroom","Tea & coffee tray","Daily housekeeping","24-hour reception"}','{pillows,desk,sitting}'),
('102','Standard room','standard',13000,1,2,'1 queen bed','Same comfort as 101, facing the inner court — the coolest room in the afternoon.',
  '{"Free unlimited internet","Smart TV","Air conditioning","Private bathroom","Tea & coffee tray","Daily housekeeping","24-hour reception"}','{pillows,desk,armchair}'),
('103','Standard room','standard',13000,1,2,'1 queen bed','Ground-floor room close to reception, good for a short stay.',
  '{"Free unlimited internet","Smart TV","Air conditioning","Private bathroom","Tea & coffee tray","Daily housekeeping","24-hour reception"}','{pillows,armchair,desk}'),
('104','Modern standard','modern',20000,1,2,'1 queen bed','A larger room with a wooden headboard wall, a full work desk and a reading chair.',
  '{"Free unlimited internet","Smart TV","Air conditioning","Private bathroom","Tea & coffee tray","Daily housekeeping","24-hour reception","Work desk & chair","Lounge armchair"}','{bed,desk,armchair}'),
('105','Modern standard','modern',20000,1,2,'1 queen bed','Bright modern room with the sitting corner by the window.',
  '{"Free unlimited internet","Smart TV","Air conditioning","Private bathroom","Tea & coffee tray","Daily housekeeping","24-hour reception","Work desk & chair","Lounge armchair"}','{bed,armchair,sitting}'),
('201','Modern standard','modern',20000,2,2,'1 queen bed','First-floor modern room, away from the street noise.',
  '{"Free unlimited internet","Smart TV","Air conditioning","Private bathroom","Tea & coffee tray","Daily housekeeping","24-hour reception","Work desk & chair","Lounge armchair"}','{bed,desk,pillows}'),
('202','Modern standard','modern',20000,2,2,'1 queen bed','Modern room opening onto the glass balcony over the forecourt.',
  '{"Free unlimited internet","Smart TV","Air conditioning","Private bathroom","Tea & coffee tray","Daily housekeeping","24-hour reception","Work desk & chair","Balcony"}','{bed,wing,desk}'),
('203','V.I.P guest room','vip',23000,2,3,'1 queen bed','More space, a proper sitting area and a balcony — our most requested room.',
  '{"Free unlimited internet","Smart TV","Air conditioning","Private bathroom","Tea & coffee tray","Daily housekeeping","24-hour reception","Work desk & chair","Lounge armchair","Balcony","Mini sitting area"}','{bed,sitting,armchair}'),
('204','V.I.P guest room','vip',23000,2,3,'1 queen bed','V.I.P room with balcony, armchair and a wide desk.',
  '{"Free unlimited internet","Smart TV","Air conditioning","Private bathroom","Tea & coffee tray","Daily housekeeping","24-hour reception","Work desk & chair","Lounge armchair","Balcony"}','{bed,armchair,lounge}'),
('301','Executive V.I.P with warm-water bath','executive',26000,3,3,'1 king bed','Our top room: warm-water bath, sitting area, balcony and the quietest floor in the house.',
  '{"Free unlimited internet","Smart TV","Air conditioning","Private bathroom","Tea & coffee tray","Daily housekeeping","24-hour reception","Warm water bath","Work desk & chair","Lounge armchair","Balcony","Sitting area"}','{bed,sitting,lounge,desk}'),
('302','Executive V.I.P with warm-water bath','executive',26000,3,3,'1 king bed','Second executive suite, same warm-water bath, facing the garden side.',
  '{"Free unlimited internet","Smart TV","Air conditioning","Private bathroom","Tea & coffee tray","Daily housekeeping","24-hour reception","Warm water bath","Work desk & chair","Lounge armchair","Balcony","Sitting area"}','{bed,lounge,sitting}'),
('303','V.I.P guest room','vip',23000,3,3,'1 queen bed','Top-floor V.I.P room with a long balcony view.',
  '{"Free unlimited internet","Smart TV","Air conditioning","Private bathroom","Tea & coffee tray","Daily housekeeping","24-hour reception","Work desk & chair","Lounge armchair","Balcony"}','{bed,armchair,sitting}')
on conflict (number) do nothing;

insert into public.menu_items (name, price, category, description, sort_order) values
('Omelette, bread & tea',1500,'Breakfast','Two eggs, fresh bread, tea or coffee.',1),
('Puff-puff & beans',1000,'Breakfast','Served hot from 6:30.',2),
('Pancakes & honey',1500,'Breakfast','',3),
('Eru & water fufu',3000,'Main dishes','The house favourite.',10),
('Ndolé with ripe plantains',3500,'Main dishes','Groundnut and bitterleaf stew.',11),
('Jollof rice & chicken',3000,'Main dishes','',12),
('Poulet DG',6000,'Main dishes','Whole chicken, plantains and vegetables — for two.',13),
('Fried rice & beef',3500,'Main dishes','',14),
('Achu & yellow soup',3000,'Main dishes','Weekends only.',15),
('Grilled tilapia & miondo',5000,'From the grill','Fresh fish, pepper sauce on the side.',20),
('Suya beef skewers',2500,'From the grill','',21),
('Roast chicken (quarter)',3000,'From the grill','',22),
('Bottled water 1.5L',500,'Drinks','',30),
('Soft drink',1000,'Drinks','',31),
('Fresh juice of the day',1500,'Drinks','',32),
('Local beer',1000,'Drinks','',33)
on conflict do nothing;
