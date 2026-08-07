-- Schema v2 del catálogo de actividades.
--
-- Los 24 tipos del DATASET se homogeneizan en 13 tipos canónicos. Para no
-- perder la variedad pedagógica, cada versión guarda su ejercicio de origen en
-- `skillFocus`, que es lo que mide la cobertura por nodo.
--
-- Se añaden además los campos estructurados que antes vivían embebidos en el
-- texto del enunciado: el texto con huecos `[gapN]`, la raíz de UoE Part 3, la
-- palabra clave y la frase de partida de UoE Part 4, y el contenido de los dos
-- tipos con sub-ítems (`swipe_deck` y `mini_game`).

ALTER TABLE "ActivityVersion" ADD COLUMN "skillFocus" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ActivityVersion" ADD COLUMN "gapText" TEXT;
ALTER TABLE "ActivityVersion" ADD COLUMN "gapLayout" TEXT;
ALTER TABLE "ActivityVersion" ADD COLUMN "cueWord" TEXT;
ALTER TABLE "ActivityVersion" ADD COLUMN "keyWord" TEXT;
ALTER TABLE "ActivityVersion" ADD COLUMN "firstSentence" TEXT;
ALTER TABLE "ActivityVersion" ADD COLUMN "optionsOrdered" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ActivityVersion" ADD COLUMN "game" TEXT;
ALTER TABLE "ActivityVersion" ADD COLUMN "cardsData" TEXT;
ALTER TABLE "ActivityVersion" ADD COLUMN "roundsData" TEXT;

-- Las versiones ya sembradas conservan su tipo original como ejercicio.
UPDATE "ActivityVersion" SET "skillFocus" = "activityTypeCode" WHERE "skillFocus" = '';

-- La corrección deja de ser un booleano: se guarda la media de aciertos y el
-- desglose por sub-ítem, que es lo que alimenta la lista de errores del
-- resumen de sesión.
ALTER TABLE "ActivityAttempt" ADD COLUMN "score" REAL NOT NULL DEFAULT 0;
ALTER TABLE "ActivityAttempt" ADD COLUMN "detail" TEXT NOT NULL DEFAULT '[]';

-- Los intentos anteriores solo tienen el booleano: se deriva la puntuación.
UPDATE "ActivityAttempt" SET "score" = 1 WHERE "isCorrect" = true;
