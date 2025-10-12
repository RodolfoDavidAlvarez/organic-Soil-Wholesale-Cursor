-- Add size_price_options column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'size_price_options'
    ) THEN
        ALTER TABLE products ADD COLUMN size_price_options JSONB;
        PRINT 'Added size_price_options column';
    END IF;
END $$;

-- Add available_size_options column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'available_size_options'
    ) THEN
        ALTER TABLE products ADD COLUMN available_size_options TEXT[];
        PRINT 'Added available_size_options column';
    END IF;
END $$;

-- Add pay_and_pickup_display_order column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'pay_and_pickup_display_order'
    ) THEN
        ALTER TABLE products ADD COLUMN pay_and_pickup_display_order INTEGER DEFAULT 0;
        PRINT 'Added pay_and_pickup_display_order column';
    END IF;
END $$;

-- Add catalog_display_order column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'catalog_display_order'
    ) THEN
        ALTER TABLE products ADD COLUMN catalog_display_order INTEGER DEFAULT 0;
        PRINT 'Added catalog_display_order column';
    END IF;
END $$;

-- Add is_catalog_enabled column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'is_catalog_enabled'
    ) THEN
        ALTER TABLE products ADD COLUMN is_catalog_enabled BOOLEAN DEFAULT true;
        PRINT 'Added is_catalog_enabled column';
    END IF;
END $$;

-- Add is_pay_and_pickup_enabled column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'is_pay_and_pickup_enabled'
    ) THEN
        ALTER TABLE products ADD COLUMN is_pay_and_pickup_enabled BOOLEAN DEFAULT false;
        PRINT 'Added is_pay_and_pickup_enabled column';
    END IF;
END $$;

-- Add pay_and_pickup_description column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'pay_and_pickup_description'
    ) THEN
        ALTER TABLE products ADD COLUMN pay_and_pickup_description TEXT;
        PRINT 'Added pay_and_pickup_description column';
    END IF;
END $$;

-- Add pay_and_pickup_hero_image column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'pay_and_pickup_hero_image'
    ) THEN
        ALTER TABLE products ADD COLUMN pay_and_pickup_hero_image TEXT;
        PRINT 'Added pay_and_pickup_hero_image column';
    END IF;
END $$;