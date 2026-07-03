---
schemaVersion: 1.0.0
id: b1-grammar-reported-statements
title: "Reported speech: enunciados con say y tell"
level: B1
category: grammar
topic: reported-speech
subtopics:
  - reported-statements
difficulty: 3
estimatedMinutes: 26
learningObjectives:
  - "Informar de enunciados con say y tell sin repetir las palabras exactas."
  - "Aplicar cambios básicos de tiempo, pronombre, posesivo y referencia temporal."
  - "Decidir cuándo el backshift es necesario y cuándo puede mantenerse el tiempo original."
prerequisites:
  - b1-grammar-past-simple-continuous
frameworkRefs:
  - cefr-companion-volume-2020
  - cambridge-b1-preliminary-format
relatedLessonIds:
  - b1-grammar-reported-questions-commands
tags:
  - b1
  - grammar
  - reported-speech
  - say
  - tell
  - backshift
status: published
author: openai-codex
reviewer: publication-authorised-by-project-owner
contentVersion: 1
---

# Resumen

El estilo directo reproduce palabras exactas:

`Maya said, “I am tired.”`

El estilo indirecto comunica el contenido:

`Maya said that she was tired.`

Cuando el verbo introductor está en pasado (`said`, `told`), el tiempo verbal
suele desplazarse un paso hacia el pasado. También adaptamos pronombres,
posesivos y expresiones como `now`, `today` o `tomorrow` al nuevo punto de vista.

`Say` no lleva normalmente una persona como objeto directo: `said that ...` o
`said to me`. `Tell` sí necesita una persona: `told me that ...`.

# Objetivos

- Construir `said (that) + oración`.
- Construir `told + persona + (that) + oración`.
- Cambiar presente simple a pasado simple.
- Cambiar presente continuo a pasado continuo.
- Cambiar present perfect y pasado simple a past perfect cuando corresponde.
- Cambiar `will` a `would` y `can` a `could`.
- Ajustar pronombres, posesivos, demostrativos, lugar y tiempo.
- Mantener el tiempo cuando la información sigue siendo cierta y el contexto lo
  justifica.

# Explicación

## Say y tell

`Say` se centra en las palabras:

`Nora said that the office was closed.`  
`Nora said, “The office is closed.”`

Si mencionamos al oyente después de `say`, usamos `to`:

`Nora said to me that the office was closed.`

`Tell` se centra en comunicar algo a una persona y necesita objeto:

`Nora told me that the office was closed.`  
No: `Nora told that ...` ni `Nora said me that ...`.

`That` es opcional en muchos enunciados:

`He said that he was busy.`  
`He said he was busy.`

El dataset suele conservar `that` en respuestas largas para hacer visible la
estructura, salvo que la consigna indique lo contrario.

## Backshift básico

Si informamos más tarde con un verbo introductor pasado:

- presente simple → pasado simple  
  `“I work remotely.”` → She said that she `worked` remotely.
- presente continuo → pasado continuo  
  `“I am waiting.”` → He said that he `was waiting`.
- pasado simple → past perfect  
  `“I lost the receipt.”` → She said that she `had lost` the receipt.
- present perfect → past perfect  
  `“We have finished.”` → They said that they `had finished`.
- `will` → `would`  
  `“I will call.”` → He said that he `would call`.
- `can` → `could`  
  `“I can help.”` → She said that she `could help`.
- `may` → `might`  
  `“It may rain.”` → He said that it `might rain`.
- `must` → `had to` cuando expresa obligación  
  `“I must leave.”` → She said that she `had to leave`.

## Pronombres y posesivos

Los cambios dependen de quién habla y de quién informa:

`Leo said, “I lost my keys.”`  
`Leo said that he had lost his keys.`

`Mina told Leo, “I can help you.”`  
`Mina told Leo that she could help him.`

No existe una sustitución automática de `I` por `he`: si la persona es Ana,
usaremos `she`; si quien informa habla de sí mismo, puede mantenerse `I`.

# Forma o estructura

## Con say

- `sujeto + said + (that) + oración`
- `sujeto + said to + persona + (that) + oración`

`Ravi said that the bus was late.`  
`Ravi said to me that the bus was late.`

## Con tell

- `sujeto + told + persona + (that) + oración`

`Ravi told me that the bus was late.`

No usamos `to` después de `told`: no `told to me`.

## Negativas

La negación pertenece a la información comunicada:

`“I don't recognise the number.”`  
`She said that she didn't recognise the number.`

`“We haven't received the parts.”`  
`They said that they hadn't received the parts.`

# Cambios de referencia

Cuando el lugar o el momento han cambiado, son frecuentes estas adaptaciones:

- `now` → `then`
- `today` → `that day`
- `tonight` → `that night`
- `yesterday` → `the day before` / `the previous day`
- `tomorrow` → `the next day` / `the following day`
- `last week` → `the week before` / `the previous week`
- `next month` → `the following month`
- `here` → `there`
- `this` → `that`
- `these` → `those`

Ejemplo:

`On Monday, Eva said, “I will finish this report tomorrow.”`  
`On Wednesday, I reported: Eva said that she would finish that report the next
day.`

Los cambios no son mecánicos si la referencia sigue siendo la misma. Si
informamos la frase durante el mismo día, `today` puede mantenerse.

# Usos principales

1. **Comunicar una opinión:** `He said that the plan was too expensive.`
2. **Transmitir información:** `She told us that the train had been cancelled.`
3. **Explicar una promesa:** `Maya said that she would call the supplier.`
4. **Informar de capacidad:** `Leo said that he could repair the lock.`
5. **Contar un hecho anterior:** `Nora said that she had missed the bus.`
6. **Transmitir una negativa:** `They said that they weren't available.`
7. **Cambiar referencias:** `He said that he would return there the next day.`
8. **Mantener un hecho general:** `The guide said that water boils at 100°C.`

# Contrastes importantes

## Said frente a told

`She said that she was ready.`  
Correcto: no se menciona oyente.

`She told me that she was ready.`  
Correcto: `tell` lleva la persona.

`She said me ...` es incorrecto.  
`She told that ...` es incorrecto si falta la persona.

## Tiempo original frente a backshift

Con un verbo introductor presente no hacemos backshift:

`Marta says, “I need help.”`  
`Marta says that she needs help.`

Con `said` y una situación pasada o cambiada, el backshift es la opción
editorial principal:

`Marta said, “I need help.”`  
`Marta said that she needed help.`

## Hecho todavía cierto

Si la información sigue siendo verdadera, es posible mantener el presente:

`The teacher said that the Earth moves around the Sun.`

También puede aparecer backshift (`moved`) en ciertos estilos, pero para hechos
generales el dataset prioriza el presente para evitar sugerir que dejaron de ser
ciertos.

## Must

Cuando `must` expresa obligación, suele cambiar a `had to`:

`“I must renew my passport.”`  
`She said that she had to renew her passport.`

Cuando expresa una deducción lógica, puede mantenerse:

`“That must be the delivery driver.”`  
`He said that it must be the delivery driver.`

Las actividades B1 usan contextos claros de obligación.

# Ejemplos

1. **Aisha said that she worked from home on Fridays.**
2. **Omar told me that his phone was charging.**
3. **The technician said that the update had finished.**
4. **Nora told us that she had left the keys at reception.**
5. **Leo said that he would send the figures the next day.**
6. **Mina told Raj that she could meet him there.**
7. **The organiser said that the event might start late.**
8. **Sara said that she had to renew her permit.**
9. **The guide said that the museum was closed that day.**
10. **My teacher said that light travels faster than sound.**

# Errores frecuentes

- ❌ *She said me that the shop was closed.*  
  ✅ *She told me that the shop was closed.*  
  O: *She said to me that ...*

- ❌ *He told that he was tired.*  
  ✅ *He said that he was tired.*  
  `Tell` necesita una persona.

- ❌ *Maya told to us that the train was late.*  
  ✅ *Maya told us that the train was late.*  
  Después de `told` no usamos `to`.

- ❌ *Leo said that I was busy* cuando `I` se refería a Leo.  
  ✅ *Leo said that he was busy.*  
  El pronombre debe reflejar al hablante original.

- ❌ *She said that she will call tomorrow* al informar días después.  
  ✅ *She said that she would call the next day.*

- ❌ *They said that they have finished.*  
  ✅ *They said that they had finished.*  
  El present perfect retrocede a past perfect.

- ❌ *He said that he had lost his keys yesterday* si `yesterday` pertenece al
  día de la frase original y contamos el hecho más tarde.  
  ✅ *He said that he had lost his keys the day before.*

# Excepciones relevantes

El backshift es una elección relacionada con tiempo, distancia y vigencia de la
información, no una transformación matemática en todos los contextos. Si Ana
dice hace un minuto `I am outside` y sabemos que sigue allí, podemos decir `Ana
said that she is outside`. Para actividades autocorregibles, la consigna
especifica si informamos más tarde o si la situación sigue vigente.

El past perfect no suele retroceder más:

`“I had already eaten.”` → He said that he had already eaten.

`Could`, `would`, `should` y `might` suelen mantenerse:

`“I could help.”` → She said that she could help.

En conversación espontánea es frecuente omitir `that`. Ambas variantes pueden
ser correctas, pero una actividad de texto exacto indicará si debe incluirse.

# Mini resumen

- `say` → `said (that) ...`
- `tell` → `told + persona + (that) ...`
- Presente → pasado.
- Presente continuo → pasado continuo.
- Pasado simple / present perfect → past perfect.
- `will` → `would`; `can` → `could`; `may` → `might`.
- Ajusta pronombres, posesivos, tiempo y lugar al nuevo contexto.
- Los hechos generales vigentes pueden mantener el presente.

# Comprobación rápida autocorregible

1. “I work on Saturdays,” Lena said.  
   Lena said that she ___ on Saturdays.
   - Respuesta: `worked`
   - Explicación: presente simple pasa a pasado simple.
2. “We have finished,” they said.  
   They said that they ___ finished.
   - Respuesta: `had`
   - Explicación: present perfect pasa a past perfect.
3. “I will call tomorrow,” Omar told me.  
   Omar told me that he ___ call the next day.
   - Respuesta: `would`
   - Explicación: `will` pasa a `would`.
4. “I can help you,” Ana told Leo.  
   Ana told Leo that she could help ___.
   - Respuesta: `him`
   - Explicación: `you` se refiere a Leo.
5. “Water freezes at 0°C,” the teacher said.  
   The teacher said that water ___ at 0°C.
   - Respuesta: `freezes`
   - Explicación: el hecho general sigue siendo cierto.
