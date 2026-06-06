/**
 * Cliente de datos — Redirige llamadas de Supabase a nuestra API FastAPI.
 * Intercepta supabase.from("tabla").select("*") y las convierte en fetch a /api/v1/...
 */

const API = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

type FilterFn = (item: any) => boolean;

interface QueryBuilder {
  select: (columns?: string) => QueryBuilder;
  eq: (field: string, value: any) => QueryBuilder;
  in: (field: string, values: any[]) => QueryBuilder;
  order: (field: string, options?: { ascending?: boolean }) => QueryBuilder;
  limit: (n: number) => QueryBuilder;
  gte: (field: string, value: string) => QueryBuilder;
  then: (resolve: (value: { data: any; error: any }) => void) => Promise<void>;
}

// Mapeo de tablas Supabase → endpoints de nuestra API
const TABLE_MAP: Record<string, { endpoint: string; isArray: boolean }> = {
  "v_active_products": { endpoint: "/products", isArray: true },
  "v_active_variants": { endpoint: "/products", isArray: true },
  "v_product_gallery": { endpoint: "/products", isArray: true },
  "categories": { endpoint: "/categories", isArray: true },
  "orders": { endpoint: "/admin/orders", isArray: true },
  "product_variants": { endpoint: "/products", isArray: true },
};

function createQueryBuilder(table: string): QueryBuilder {
  const filters: FilterFn[] = [];
  let _limit = 100;
  let _orderField = "";
  let _orderAsc = true;
  let _selectColumns = "*";
  let _eqFilter: Record<string, any> = {};
  let _inFilter: Record<string, any[]> = {};
  let _gteFilter: Record<string, string> = {};

  const self: QueryBuilder = {
    select(cols = "*") {
      _selectColumns = cols;
      return self;
    },
    eq(field, value) {
      _eqFilter[field] = value;
      return self;
    },
    in(field, values) {
      _inFilter[field] = values;
      return self;
    },
    order(field, options) {
      _orderField = field;
      _orderAsc = options?.ascending ?? true;
      return self;
    },
    limit(n) {
      _limit = n;
      return self;
    },
    gte(field, value) {
      _gteFilter[field] = value;
      return self;
    },
    async then(resolve) {
      try {
        const mapping = TABLE_MAP[table];
        if (!mapping) {
          resolve({ data: [], error: { message: `Tabla "${table}" no mapeada` } });
          return;
        }

        let url = `${API}${mapping.endpoint}?limit=${_limit}`;

        // Añadir filtros como query params
        for (const [key, val] of Object.entries(_eqFilter)) {
          url += `&${key}=${encodeURIComponent(val)}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
          resolve({ data: null, error: { message: `Error ${res.status}` } });
          return;
        }

        const json = await res.json();
        let data = json.data || [];

        // Si es array de productos, extraer variantes
        if (table === "v_active_variants" && Array.isArray(data)) {
          const flat: any[] = [];
          for (const p of data) {
            for (const v of (p.variants || [])) {
              flat.push({ ...v, product_id: p.id, product_name: p.name });
            }
          }
          data = flat;
        }

        if (table === "v_product_gallery" && Array.isArray(data)) {
          const flat: any[] = [];
          for (const p of data) {
            const primary = p.primary_image_url;
            if (primary) {
              flat.push({ product_id: p.id, image_url: primary, is_primary: true });
            }
          }
          data = flat;
        }

        // Aplicar filtros IN
        for (const [field, values] of Object.entries(_inFilter)) {
          data = data.filter((item: any) => values.includes(item[field]));
        }

        // Aplicar filtros GTE
        for (const [field, val] of Object.entries(_gteFilter)) {
          data = data.filter((item: any) => item[field] >= val);
        }

        if (_limit > 0) {
          data = data.slice(0, _limit);
        }

        resolve({ data, error: null });
      } catch (e: any) {
        resolve({ data: [], error: { message: e.message } });
      }
    },
  };

  return self;
}

// Proxy que intercepta .from("tabla") y devuelve un query builder
export const supabase = new Proxy({} as any, {
  get(_target, prop: string) {
    if (prop === "from") {
      return (table: string) => createQueryBuilder(table);
    }
    if (prop === "auth") {
      return {
        getSession: async () => ({ data: { session: null }, error: null }),
        signOut: async () => ({ error: null }),
      };
    }
    return undefined;
  },
});
