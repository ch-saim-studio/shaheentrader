CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  username text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "roles_read_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles_admin_manage" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  category text NOT NULL CHECK (category IN ('tshirts','hoodies','pants','shoes')),
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_url text NOT NULL DEFAULT '',
  sizes text[] NOT NULL DEFAULT '{}',
  stock integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_admin_write" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  customer_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  total numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_read_own_or_admin" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_admin_update" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders_admin_delete" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  image_url text NOT NULL DEFAULT '',
  size text,
  quantity integer NOT NULL DEFAULT 1,
  price numeric(10,2) NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_read" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "order_items_insert_own" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);

INSERT INTO public.products (name, slug, category, description, price, image_url, sizes, stock, featured) VALUES
('Shaheen Classic Tee','shaheen-classic-tee','tshirts','Heavyweight 240gsm cotton tee with a boxy street fit and screen-printed Shaheen crest.',1499,'/images/tshirts.jpg','{"S","M","L","XL"}',40,true),
('Falcon Oversized Tee','falcon-oversized-tee','tshirts','Drop-shoulder oversized tee in washed black, built for layering.',1799,'/images/tshirts.jpg','{"M","L","XL","XXL"}',32,false),
('Karachi Nights Tee','karachi-nights-tee','tshirts','Graphic tee inspired by neon city nights. Soft-hand print, pre-shrunk.',1699,'/images/tshirts.jpg','{"S","M","L","XL"}',25,false),
('Street Fleece Hoodie','street-fleece-hoodie','hoodies','380gsm brushed fleece hoodie with kangaroo pocket and ribbed cuffs.',3999,'/images/hoodies.jpg','{"S","M","L","XL"}',20,true),
('Shaheen Zip Hoodie','shaheen-zip-hoodie','hoodies','Full-zip hoodie with embroidered wing logo and heavy metal zipper.',4499,'/images/hoodies.jpg','{"M","L","XL"}',15,false),
('Blackout Pullover','blackout-pullover','hoodies','Minimal all-black pullover hoodie with tonal chest print.',3799,'/images/hoodies.jpg','{"S","M","L","XL","XXL"}',18,false),
('Cargo Utility Pants','cargo-utility-pants','pants','Six-pocket cargo pants in ripstop cotton with adjustable ankle straps.',3499,'/images/pants.jpg','{"30","32","34","36"}',22,true),
('Relaxed Denim Jeans','relaxed-denim-jeans','pants','Relaxed straight-leg jeans in mid-wash rigid denim.',3899,'/images/pants.jpg','{"30","32","34","36","38"}',26,false),
('Tech Jogger','tech-jogger','pants','Tapered jogger in stretch tech fabric with zip pockets.',2999,'/images/pants.jpg','{"S","M","L","XL"}',30,false),
('Court Runner Sneakers','court-runner-sneakers','shoes','Low-top court sneakers with cushioned midsole and grippy rubber outsole.',6499,'/images/shoes.jpg','{"39","40","41","42","43","44"}',14,true),
('Trail Grip High-Tops','trail-grip-high-tops','shoes','High-top trainers with chunky lug sole and padded collar.',7499,'/images/shoes.jpg','{"40","41","42","43","44"}',10,false),
('Everyday Slip-Ons','everyday-slip-ons','shoes','Canvas slip-ons with memory-foam insole for all-day wear.',3299,'/images/shoes.jpg','{"39","40","41","42","43"}',19,false);