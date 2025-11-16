-- Migration: Agenda Module
-- Adds tables for calendar events, rooms (salas), and resource bookings

-- Event type enum
CREATE TYPE event_type AS ENUM (
  'velatorio',      -- Wake
  'ceremonia',      -- Religious ceremony
  'cremacion',      -- Cremation
  'inhumacion',     -- Burial
  'recogida',       -- Pickup/retrieval
  'reunion',        -- Meeting
  'mantenimiento',  -- Maintenance
  'otro'            -- Other
);

-- Resource type enum
CREATE TYPE resource_type AS ENUM (
  'sala',           -- Room
  'vehiculo',       -- Vehicle
  'colaborador',    -- Collaborator/Staff
  'equipamiento'    -- Equipment
);

-- Rooms table (Salas de velatorio/ceremonia)
CREATE TABLE rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  funeral_home_id UUID NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  capacidad INTEGER,
  ubicacion VARCHAR(255),
  equipamiento TEXT[],
  estado_activo BOOLEAN DEFAULT TRUE,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for calendar display
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX idx_rooms_funeral_home ON rooms(funeral_home_id);
CREATE INDEX idx_rooms_branch ON rooms(branch_id);
CREATE INDEX idx_rooms_active ON rooms(estado_activo);

-- Agenda events table
CREATE TABLE agenda_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  funeral_home_id UUID NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,

  -- Event details
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo_evento event_type NOT NULL,

  -- Timing
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ NOT NULL,
  todo_el_dia BOOLEAN DEFAULT FALSE,

  -- Recurrence (optional, for recurring events)
  es_recurrente BOOLEAN DEFAULT FALSE,
  patron_recurrencia JSONB, -- {frequency: 'daily'|'weekly'|'monthly', interval: 1, endDate: '...'}

  -- Visual
  color VARCHAR(7), -- Override color if not using resource color

  -- Status
  estado VARCHAR(20) DEFAULT 'programado', -- programado, en_progreso, completado, cancelado

  -- Metadata
  notas TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for agenda events
CREATE INDEX idx_events_funeral_home ON agenda_events(funeral_home_id);
CREATE INDEX idx_events_branch ON agenda_events(branch_id);
CREATE INDEX idx_events_service ON agenda_events(service_id);
CREATE INDEX idx_events_dates ON agenda_events(fecha_inicio, fecha_fin);
CREATE INDEX idx_events_type ON agenda_events(tipo_evento);
CREATE INDEX idx_events_estado ON agenda_events(estado);

-- Resource bookings (tracks which resources are used for each event)
CREATE TABLE agenda_resource_bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES agenda_events(id) ON DELETE CASCADE,

  -- Polymorphic resource reference
  tipo_recurso resource_type NOT NULL,
  recurso_id UUID NOT NULL, -- ID of room, vehicle, or collaborator

  -- Optional override times (if resource is booked for different time than event)
  fecha_inicio_reserva TIMESTAMPTZ,
  fecha_fin_reserva TIMESTAMPTZ,

  -- Status
  confirmado BOOLEAN DEFAULT TRUE,
  notas TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique resource per event
  UNIQUE(event_id, tipo_recurso, recurso_id)
);

-- Indexes for resource bookings
CREATE INDEX idx_bookings_event ON agenda_resource_bookings(event_id);
CREATE INDEX idx_bookings_resource ON agenda_resource_bookings(tipo_recurso, recurso_id);
CREATE INDEX idx_bookings_dates ON agenda_resource_bookings(fecha_inicio_reserva, fecha_fin_reserva);

-- Function to check for resource conflicts
CREATE OR REPLACE FUNCTION check_resource_conflict(
  p_tipo_recurso resource_type,
  p_recurso_id UUID,
  p_fecha_inicio TIMESTAMPTZ,
  p_fecha_fin TIMESTAMPTZ,
  p_exclude_event_id UUID DEFAULT NULL
)
RETURNS TABLE (
  event_id UUID,
  titulo VARCHAR(255),
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ae.id as event_id,
    ae.titulo,
    COALESCE(arb.fecha_inicio_reserva, ae.fecha_inicio) as fecha_inicio,
    COALESCE(arb.fecha_fin_reserva, ae.fecha_fin) as fecha_fin
  FROM agenda_resource_bookings arb
  JOIN agenda_events ae ON arb.event_id = ae.id
  WHERE arb.tipo_recurso = p_tipo_recurso
    AND arb.recurso_id = p_recurso_id
    AND arb.confirmado = TRUE
    AND ae.estado != 'cancelado'
    AND (p_exclude_event_id IS NULL OR ae.id != p_exclude_event_id)
    AND (
      -- Check for time overlap
      (COALESCE(arb.fecha_inicio_reserva, ae.fecha_inicio), COALESCE(arb.fecha_fin_reserva, ae.fecha_fin))
      OVERLAPS
      (p_fecha_inicio, p_fecha_fin)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available resources for a time slot
CREATE OR REPLACE FUNCTION get_available_resources(
  p_funeral_home_id UUID,
  p_branch_id UUID,
  p_tipo_recurso resource_type,
  p_fecha_inicio TIMESTAMPTZ,
  p_fecha_fin TIMESTAMPTZ
)
RETURNS TABLE (
  recurso_id UUID,
  nombre TEXT
) AS $$
BEGIN
  IF p_tipo_recurso = 'sala' THEN
    RETURN QUERY
    SELECT r.id, r.nombre::TEXT
    FROM rooms r
    WHERE r.funeral_home_id = p_funeral_home_id
      AND r.branch_id = p_branch_id
      AND r.estado_activo = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM check_resource_conflict('sala'::resource_type, r.id, p_fecha_inicio, p_fecha_fin)
      );
  ELSIF p_tipo_recurso = 'vehiculo' THEN
    RETURN QUERY
    SELECT v.id, v.placa::TEXT
    FROM vehicles v
    WHERE v.funeral_home_id = p_funeral_home_id
      AND (v.branch_id = p_branch_id OR v.branch_id IS NULL)
      AND v.estado = 'disponible'
      AND NOT EXISTS (
        SELECT 1 FROM check_resource_conflict('vehiculo'::resource_type, v.id, p_fecha_inicio, p_fecha_fin)
      );
  ELSIF p_tipo_recurso = 'colaborador' THEN
    RETURN QUERY
    SELECT c.id, c.nombre_completo::TEXT
    FROM collaborators c
    WHERE c.funeral_home_id = p_funeral_home_id
      AND (c.branch_id = p_branch_id OR c.branch_id IS NULL)
      AND c.estado_activo = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM check_resource_conflict('colaborador'::resource_type, c.id, p_fecha_inicio, p_fecha_fin)
      );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create agenda events from services (when dates are added)
CREATE OR REPLACE FUNCTION create_service_events()
RETURNS TRIGGER AS $$
DECLARE
  v_event_id UUID;
BEGIN
  -- Create wake event if date is set
  IF NEW.fecha_inicio_velatorio IS NOT NULL AND
     (OLD IS NULL OR OLD.fecha_inicio_velatorio IS DISTINCT FROM NEW.fecha_inicio_velatorio) THEN
    INSERT INTO agenda_events (
      funeral_home_id, branch_id, service_id, titulo, descripcion, tipo_evento,
      fecha_inicio, fecha_fin, color, created_by
    ) VALUES (
      NEW.funeral_home_id,
      NEW.branch_id,
      NEW.id,
      'Velatorio - ' || NEW.nombre_fallecido,
      'Servicio #' || NEW.numero_servicio,
      'velatorio',
      NEW.fecha_inicio_velatorio,
      NEW.fecha_inicio_velatorio + INTERVAL '12 hours', -- Default 12 hour duration
      '#8B5CF6', -- Purple for wakes
      NEW.created_by
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_event_id;

    -- Auto-book room if specified
    IF v_event_id IS NOT NULL AND NEW.sala_velatorio IS NOT NULL THEN
      -- Try to find room by name and book it
      INSERT INTO agenda_resource_bookings (event_id, tipo_recurso, recurso_id)
      SELECT v_event_id, 'sala'::resource_type, r.id
      FROM rooms r
      WHERE r.nombre = NEW.sala_velatorio
        AND r.funeral_home_id = NEW.funeral_home_id
        AND r.branch_id = NEW.branch_id
      LIMIT 1
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Create ceremony event if date is set
  IF NEW.fecha_ceremonia_religiosa IS NOT NULL AND
     (OLD IS NULL OR OLD.fecha_ceremonia_religiosa IS DISTINCT FROM NEW.fecha_ceremonia_religiosa) THEN
    INSERT INTO agenda_events (
      funeral_home_id, branch_id, service_id, titulo, descripcion, tipo_evento,
      fecha_inicio, fecha_fin, color, created_by
    ) VALUES (
      NEW.funeral_home_id,
      NEW.branch_id,
      NEW.id,
      'Ceremonia - ' || NEW.nombre_fallecido,
      'Servicio #' || NEW.numero_servicio,
      'ceremonia',
      NEW.fecha_ceremonia_religiosa,
      NEW.fecha_ceremonia_religiosa + INTERVAL '2 hours', -- Default 2 hour duration
      '#3B82F6', -- Blue for ceremonies
      NEW.created_by
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Create burial/cremation event if date is set
  IF NEW.fecha_inhumacion_cremacion IS NOT NULL AND
     (OLD IS NULL OR OLD.fecha_inhumacion_cremacion IS DISTINCT FROM NEW.fecha_inhumacion_cremacion) THEN
    INSERT INTO agenda_events (
      funeral_home_id, branch_id, service_id, titulo, descripcion, tipo_evento,
      fecha_inicio, fecha_fin, color, created_by
    ) VALUES (
      NEW.funeral_home_id,
      NEW.branch_id,
      NEW.id,
      CASE WHEN NEW.tipo_servicio = 'cremacion' THEN 'Cremación' ELSE 'Inhumación' END || ' - ' || NEW.nombre_fallecido,
      'Servicio #' || NEW.numero_servicio,
      CASE WHEN NEW.tipo_servicio = 'cremacion' THEN 'cremacion'::event_type ELSE 'inhumacion'::event_type END,
      NEW.fecha_inhumacion_cremacion,
      NEW.fecha_inhumacion_cremacion + INTERVAL '3 hours', -- Default 3 hour duration
      '#EF4444', -- Red for burial/cremation
      NEW.created_by
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Create pickup event if date is set
  IF NEW.fecha_recogida IS NOT NULL AND
     (OLD IS NULL OR OLD.fecha_recogida IS DISTINCT FROM NEW.fecha_recogida) THEN
    INSERT INTO agenda_events (
      funeral_home_id, branch_id, service_id, titulo, descripcion, tipo_evento,
      fecha_inicio, fecha_fin, color, created_by
    ) VALUES (
      NEW.funeral_home_id,
      NEW.branch_id,
      NEW.id,
      'Recogida - ' || NEW.nombre_fallecido,
      'Servicio #' || NEW.numero_servicio || ' - ' || COALESCE(NEW.lugar_fallecimiento, ''),
      'recogida',
      NEW.fecha_recogida,
      NEW.fecha_recogida + INTERVAL '2 hours', -- Default 2 hour duration
      '#F97316', -- Orange for pickups
      NEW.created_by
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_event_id;

    -- Auto-book main vehicle if specified
    IF v_event_id IS NOT NULL AND NEW.vehiculo_principal_id IS NOT NULL THEN
      INSERT INTO agenda_resource_bookings (event_id, tipo_recurso, recurso_id)
      VALUES (v_event_id, 'vehiculo'::resource_type, NEW.vehiculo_principal_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create events from services
CREATE TRIGGER service_events_trigger
  AFTER INSERT OR UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION create_service_events();

-- Updated at trigger for rooms
CREATE TRIGGER rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated at trigger for agenda_events
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON agenda_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated at trigger for agenda_resource_bookings
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON agenda_resource_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rooms in their funeral home"
  ON rooms FOR SELECT
  USING (funeral_home_id = get_user_funeral_home_id());

CREATE POLICY "Users can insert rooms in their funeral home"
  ON rooms FOR INSERT
  WITH CHECK (funeral_home_id = get_user_funeral_home_id());

CREATE POLICY "Users can update rooms in their funeral home"
  ON rooms FOR UPDATE
  USING (funeral_home_id = get_user_funeral_home_id());

CREATE POLICY "Users can delete rooms in their funeral home"
  ON rooms FOR DELETE
  USING (funeral_home_id = get_user_funeral_home_id());

-- RLS Policies for agenda_events
ALTER TABLE agenda_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events in their funeral home"
  ON agenda_events FOR SELECT
  USING (funeral_home_id = get_user_funeral_home_id());

CREATE POLICY "Users can insert events in their funeral home"
  ON agenda_events FOR INSERT
  WITH CHECK (funeral_home_id = get_user_funeral_home_id());

CREATE POLICY "Users can update events in their funeral home"
  ON agenda_events FOR UPDATE
  USING (funeral_home_id = get_user_funeral_home_id());

CREATE POLICY "Users can delete events in their funeral home"
  ON agenda_events FOR DELETE
  USING (funeral_home_id = get_user_funeral_home_id());

-- RLS Policies for agenda_resource_bookings
ALTER TABLE agenda_resource_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bookings for events in their funeral home"
  ON agenda_resource_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agenda_events ae
      WHERE ae.id = event_id
        AND ae.funeral_home_id = get_user_funeral_home_id()
    )
  );

CREATE POLICY "Users can insert bookings for events in their funeral home"
  ON agenda_resource_bookings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agenda_events ae
      WHERE ae.id = event_id
        AND ae.funeral_home_id = get_user_funeral_home_id()
    )
  );

CREATE POLICY "Users can update bookings for events in their funeral home"
  ON agenda_resource_bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM agenda_events ae
      WHERE ae.id = event_id
        AND ae.funeral_home_id = get_user_funeral_home_id()
    )
  );

CREATE POLICY "Users can delete bookings for events in their funeral home"
  ON agenda_resource_bookings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM agenda_events ae
      WHERE ae.id = event_id
        AND ae.funeral_home_id = get_user_funeral_home_id()
    )
  );

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION check_resource_conflict TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_resources TO authenticated;
