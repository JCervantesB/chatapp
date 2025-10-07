<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Cómo usar la API de SinkinAI en Next.js: Guía Práctica

La integración de la API de SinkinAI en tu proyecto Next.js te permite consumir modelos de IA para generar imágenes desde prompts de texto, enviar imágenes de referencia y personalizar numerosas opciones de inferencia. Esta guía te ofrece un panorama completo, ejemplos listos y recomendaciones para lograrlo de manera segura y funcional.

## Resumen de la Integración

- **SinkinAI ofrece una API para generar imágenes IA (endpoint `/api/inference`).**
- **La integración en Next.js se realiza creando un formulario (cliente) y una API Route (servidor) que envía los datos a SinkinAI usando `FormData`.**
- **La respuesta puede ser una o varias URLs de imágenes, o un mensaje de error.**


## Flujo de Trabajo: Diagrama

A continuación se muestra el flujo típico de integración, desde que el usuario envía el formulario hasta recibir el resultado:

![Flujo de integración de SinkinAI API en Next.js](https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/a211705e87e409f96941d46cda7307e8/0b0881ee-80cd-4b8f-bae7-f85f05387e5f/c8222b88.png)

Flujo de integración de SinkinAI API en Next.js

## 1. Formulario en Next.js para Enviar la Solicitud

Un formulario sencillo permite al usuario ingresar un prompt, elegir modelo, parámetros personalizados y (opcionalmente) una imagen base para generación tipo img2img.

![Ejemplo de formulario en Nextjs para API IA](https://user-gen-media-assets.s3.amazonaws.com/seedream_images/8043dc78-a2fd-46a9-b4de-af2fec48cf86.png)

Ejemplo de formulario en Nextjs para API IA

## 2. Ejemplo de Código Cliente: React + Next.js

```jsx
'use client';
import { useState } from 'react';

export default function SinkinAIDemo() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const res = await fetch('/api/sinkin', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="prompt" placeholder="Prompt..." required />
      <input name="access_token" placeholder="Access Token" required />
      <input name="model_id" placeholder="Model ID" required />
      <input type="file" name="init_image_file" accept="image/*" />
      <button disabled={loading}>Generar</button>
      {loading ? <p>Generando...</p> : null}
      {result && result.images
        ? result.images.map((img, i) => <img key={i} src={img} width={256} />)
        : null}
      {result && result.error_code === 1 ? <p>{result.message}</p> : null}
    </form>
  );
}
```

**Puntos clave:**

- Usamos un formulario HTML tradicional, con soporte para archivos.
- El formulario recolecta los parámetros requeridos por SinkinAI y el archivo opcional.
- Al enviar, se usa `fetch` con método POST y cuerpo `FormData`.


## 3. API Route en Next.js para Mediar la Solicitud

Puedes definir un handler en `app/api/sinkin/route.js` (Next 13+) que reciba el form, extraiga los datos y reenvíe la solicitud a SinkinAI.

```js
export async function POST(req) {
  const formData = await req.formData();
  // Define los nombres esperados por SinkinAI
  const params = {};
  for (const key of [
    'access_token','model_id','prompt','width','height','negative_prompt',
    'steps','scale','num_images','seed','scheduler','lora','lora_scale','version',
    'controlnet','image_strength'
  ]) {
    const v = formData.get(key);
    if (v !== null && v !== undefined && v !== '') params[key] = v;
  }
  // Archivo opcional
  let fetchOptions;
  if (formData.get('init_image_file')) {
    const imageFile = formData.get('init_image_file');
    const multipart = new FormData();
    for (const key in params) multipart.append(key, params[key]);
    multipart.append('init_image_file', imageFile, imageFile.name);
    fetchOptions = { method: 'POST', body: multipart };
  } else {
    const multipart = new FormData();
    for (const key in params) multipart.append(key, params[key]);
    fetchOptions = { method: 'POST', body: multipart };
  }
  // Hacemos la petición a SinkinAI
  const response = await fetch('https://sinkin.ai/api/inference', fetchOptions);
  const data = await response.json();
  return Response.json(data);
}
```


## 4. Consideraciones y Buenas Prácticas

- **Nunca expongas el `access_token` en el frontend** para usuarios no confiables. Puedes almacenarlo como variable de entorno y solo exponer si es seguro.
- **Valida los parámetros antes de enviar.** Asegúrate que los valores como dimensiones, steps y modelo sean válidos según la documentación de SinkinAI.
- **Elige el `model_id` adecuado.** Puedes consultarlo en la web de SinkinAI o usando el endpoint `/api/models` mediante un POST y tu token.
- **Procesa e informa de los posibles errores**: si viene `error_code: 1`, muestra el mensaje de error retornado.


## 5. Lista de campos típicos que acepta SinkinAI

- `access_token`: *Obligatorio* (tu token de cuenta)
- `model_id`: *Obligatorio* (ej: `yBG2r9O` para MajicMix Realistic)
- `prompt`: *Obligatorio* (el mensaje de texto)
- `init_image_file`: Opcional (para img2img/controlnet)
- `width`, `height`, `steps`, `scale`, `negative_prompt`, `num_images`, `seed`, `scheduler`, `version`, `controlnet`, `image_strength` y otros.

Puedes consultar la documentación completa en la [guía oficial de SinkinAI].

## 6. Archivo de ejemplo para tu proyecto

Aquí tienes un ejemplo descargable, con la integración básica lista para Next.js:

## 7. Recursos útiles

- [Documentación oficial SinkinAI](https://sinkin.notion.site/SinkIn-API-7fa0dc746d624629bb3c680d913cbbf4#2c06c274123244a2bb8e0a213fe0e8ca)
- Next.js Guides: API Routes y manejo de formularios.


## Conclusión

Integrar la API de SinkinAI en una aplicación Next.js es directo si dominas el manejo de formularios y peticiones multipart/form-data en JavaScript moderno. Recuerda validar y proteger tus tokens, y adapta el formulario según los controles que desees exponer al usuario. La clave está en estructurar bien el flujo: la UI recoge parámetros, el API Route intermedia la solicitud y la respuesta gestiona el resultado.

***
<span style="display:none">[^1_1][^1_10][^1_11][^1_12][^1_13][^1_14][^1_15][^1_16][^1_17][^1_18][^1_19][^1_2][^1_20][^1_21][^1_22][^1_23][^1_24][^1_25][^1_26][^1_27][^1_28][^1_29][^1_3][^1_30][^1_31][^1_32][^1_33][^1_34][^1_35][^1_36][^1_37][^1_38][^1_39][^1_4][^1_40][^1_41][^1_42][^1_43][^1_44][^1_45][^1_46][^1_47][^1_48][^1_49][^1_5][^1_50][^1_6][^1_7][^1_8][^1_9]</span>

<div align="center">⁂</div>

[^1_1]: https://www.reddit.com/r/nextjs/comments/15jipn0/how_to_access_data_when_im_sending_formdata_as/

[^1_2]: https://www.codeporx.com/blog/como-consumir-apis-en-nextjs-con-fetch-y-axios

[^1_3]: https://help.interacty.me/es/content/integracion-de-la-api-de-javascript

[^1_4]: https://stackoverflow.com/questions/35192841/how-do-i-post-with-multipart-form-data-using-fetch

[^1_5]: https://www.youtube.com/watch?v=k3Cxo1hHqBE

[^1_6]: https://nelkodev.com/blog/integracion-de-apis-con-javascript-documentacion-y-ejemplos-de-integracion/

[^1_7]: https://flaviocopes.com/fix-formdata-multipart-fetch/

[^1_8]: https://translate.google.com/translate?u=https%3A%2F%2Fnextjs.org%2Fblog%2Fbuilding-apis-with-nextjs\&hl=es\&sl=en\&tl=es\&client=srp

[^1_9]: https://www.ibm.com/docs/es/dbaoc?topic=reference-javascript-apis-that-can-be-used-in-views

[^1_10]: https://www.youtube.com/watch?v=vDagmH88NYM

[^1_11]: https://translate.google.com/translate?u=https%3A%2F%2Fmedium.com%2F%40kusuma844%2Feasiest-way-for-next-js-to-fetch-external-api-for-displaying-data-2ebabbdd3c9e\&hl=es\&sl=en\&tl=es\&client=srp

[^1_12]: https://profile.es/blog/consumir-api-javascript/

[^1_13]: https://github.com/vercel/next.js/discussions/36153

[^1_14]: https://translate.google.com/translate?u=https%3A%2F%2Fauth0.com%2Fblog%2Fusing-nextjs-server-actions-to-call-external-apis%2F\&hl=es\&sl=en\&tl=es\&client=srp

[^1_15]: https://www.ibm.com/docs/es/integration-bus/10.0.0?topic=services-integration-service-javascript-client-api

[^1_16]: https://github.com/vercel/next.js/discussions/39957

[^1_17]: https://translate.google.com/translate?u=https%3A%2F%2Fwww.geeksforgeeks.org%2Freactjs%2Fhow-to-send-post-request-to-external-api-in-nextjs%2F\&hl=es\&sl=en\&tl=es\&client=srp

[^1_18]: https://translate.google.com/translate?u=https%3A%2F%2Fwww.educative.io%2Fblog%2Fhow-to-integrate-api-in-javascript\&hl=es\&sl=en\&tl=es\&client=srp

[^1_19]: https://nextjs.org/docs/app/getting-started/fetching-data

[^1_20]: https://translate.google.com/translate?u=https%3A%2F%2Fwww.wisp.blog%2Fblog%2Fnextjs-15-api-get-and-post-request-examples\&hl=es\&sl=en\&tl=es\&client=srp

[^1_21]: https://es.stackoverflow.com/questions/44970/cuál-es-la-forma-correcta-de-hacer-este-fetch-para-enviar-una-imagen

[^1_22]: https://www.reddit.com/r/nextjs/comments/12wv8tn/sending_form_data_from_an_api_route_to_an/

[^1_23]: https://dev.to/mazinashfaq/handling-multipartform-data-in-nextjs-26ea

[^1_24]: https://translate.google.com/translate?u=https%3A%2F%2Fstackoverflow.com%2Fquestions%2F36067767%2Fhow-do-i-upload-a-file-with-the-js-fetch-api\&hl=es\&sl=en\&tl=es\&client=srp

[^1_25]: https://translate.google.com/translate?u=https%3A%2F%2Fstackoverflow.com%2Fquestions%2F67305210%2Fformdata-with-nextjs-api\&hl=es\&sl=en\&tl=es\&client=srp

[^1_26]: https://apidog.com/es/blog/nextjs-fetch-data-3/

[^1_27]: https://translate.google.com/translate?u=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Fdiscussions%2F39957\&hl=es\&sl=en\&tl=es\&client=srp

[^1_28]: https://translate.google.com/translate?u=https%3A%2F%2Fnextjs.org%2Fdocs%2Fapp%2Fguides%2Fforms\&hl=es\&sl=en\&tl=es\&client=srp

[^1_29]: https://translate.google.com/translate?u=https%3A%2F%2Fflaviocopes.com%2Ffix-formdata-multipart-fetch%2F\&hl=es\&sl=en\&tl=es\&client=srp

[^1_30]: https://developer.mozilla.org/es/docs/Web/API/Fetch_API/Using_Fetch

[^1_31]: https://translate.google.com/translate?u=https%3A%2F%2Fmedium.com%2F%40farmaan30327%2Faccessing-formdata-and-headers-in-nextjs-backend-2529e7420320\&hl=es\&sl=en\&tl=es\&client=srp

[^1_32]: https://translate.google.com/translate?u=https%3A%2F%2Fwww.dhiwise.com%2Fpost%2Fhow-to-handle-a-nextjs-post-request-a-complete-guide\&hl=es\&sl=en\&tl=es\&client=srp

[^1_33]: https://www.wisp.blog/blog/nextjs-15-api-get-and-post-request-examples

[^1_34]: https://translate.google.com/translate?u=https%3A%2F%2Fnextjs.org%2Fdocs%2Fpages%2Fguides%2Fforms\&hl=es\&sl=en\&tl=es\&client=srp

[^1_35]: https://translate.google.com/translate?u=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Fdiscussions%2F36153\&hl=es\&sl=en\&tl=es\&client=srp

[^1_36]: https://ai-sdk.dev/cookbook/next/generate-object-with-file-prompt

[^1_37]: https://es.stackoverflow.com/questions/586546/como-enviar-un-objeto-a-la-api-de-next-js-a-través-de-un-fetch

[^1_38]: https://platzi.com/cursos/windsurf/creacion-de-endpoints-de-api-con-next-js/

[^1_39]: https://createappai.com/blog/file-upload

[^1_40]: https://www.youtube.com/watch?v=7JJjOoV31Xg

[^1_41]: https://www.codeporx.com/blog/como-crear-api-en-nextjs

[^1_42]: https://es.stackoverflow.com/questions/516039/enviar-formdata-con-fetch

[^1_43]: https://www.reddit.com/r/dotnet/comments/1k1g9on/how_do_you_integrate_nextjs_with_net_web_api_in/

[^1_44]: https://www.escuelafrontend.com/data-fetching-con-next-js

[^1_45]: https://translate.google.com/translate?u=https%3A%2F%2Fdev.to%2Frdvornov%2Fconverting-formdata-to-a-multipartform-data-string-and-back-using-response-326g\&hl=es\&sl=en\&tl=es\&client=srp

[^1_46]: https://es.nextjs.im/docs/pages/guides/forms

[^1_47]: https://translate.google.com/translate?u=https%3A%2F%2Fdev.to%2Fhamzakhan%2F5-effective-ways-to-make-api-requests-in-nextjs-56bc\&hl=es\&sl=en\&tl=es\&client=srp

[^1_48]: https://translate.google.com/translate?u=https%3A%2F%2Frefine.dev%2Fblog%2Fhow-to-multipart-file-upload-with-react-hook-form%2F\&hl=es\&sl=en\&tl=es\&client=srp

[^1_49]: https://translate.google.com/translate?u=https%3A%2F%2Fwww.geeksforgeeks.org%2Freactjs%2Fhow-to-submit-nextjs-form-to-api-using-formdata%2F\&hl=es\&sl=en\&tl=es\&client=srp

[^1_50]: https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/a211705e87e409f96941d46cda7307e8/4bf8cf15-d7ee-476f-9d0b-d7ec69e59a29/61869ef2.md


---

# Cómo usar LoRAs en la API de SinkInAI con Next.js

Tienes razón, los LoRAs son un aspecto importante que no estaba detallado en mi respuesta anterior. Según la documentación oficial de SinkInAI, sí existe soporte para LoRAs y aquí te explico exactamente cómo usarlos.

## Parámetros de LoRA en SinkInAI

La API de SinkInAI soporta LoRAs a través de **dos parámetros específicos**:

1. **`lora`** (String, opcional): El ID del modelo LoRA que quieres utilizar
2. **`lora_scale`** (Float, opcional): La intensidad del LoRA (valor por defecto = 0.75)

## Cómo obtener los IDs de LoRAs disponibles

Para usar LoRAs, primero necesitas obtener la lista de LoRAs disponibles usando el endpoint `/models`:

### API Route para obtener modelos y LoRAs

```js
// app/api/sinkin-models/route.js
export async function POST(req) {
  const formData = await req.formData();
  const accessToken = formData.get('access_token');
  
  const params = new FormData();
  params.append('access_token', accessToken);
  
  const response = await fetch('https://sinkin.ai/api/models', {
    method: 'POST',
    body: params
  });
  
  const data = await response.json();
  return Response.json(data);
}
```

Este endpoint devuelve un JSON con la siguiente estructura:

```json
{
  "error_code": 0,
  "models": [{"id": "XXXX", "title": "XXXX", "cover_img": "xxx", "link": "xxx"}, ...],
  "loras": [{"id": "XXXX", "title": "XXXX", "cover_img": "xxx", "link": "xxx"}, ...]
}
```


## Implementación en Next.js con soporte para LoRAs

### Cliente React actualizado

```jsx
'use client';
import { useState, useEffect } from 'react';

export default function SinkinAIWithLora() {
  const [models, setModels] = useState([]);
  const [loras, setLoras] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadModelsAndLoras();
  }, []);

  async function loadModelsAndLoras() {
    const formData = new FormData();
    formData.append('access_token', 'tu_access_token_aqui');
    
    const res = await fetch('/api/sinkin-models', {
      method: 'POST',
      body: formData
    });
    
    const data = await res.json();
    if (data.error_code === 0) {
      setModels(data.models || []);
      setLoras(data.loras || []);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    
    const res = await fetch('/api/sinkin', {
      method: 'POST',
      body: formData,
    });
    
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="access_token" placeholder="Access Token" required />
      
      {/* Selector de modelo base */}
      <select name="model_id" required>
        <option value="">Selecciona un modelo</option>
        {models.map(model => (
          <option key={model.id} value={model.id}>
            {model.title}
          </option>
        ))}
      </select>
      
      <input name="prompt" placeholder="Prompt..." required />
      
      {/* Selector de LoRA (opcional) */}
      <select name="lora">
        <option value="">Sin LoRA</option>
        {loras.map(lora => (
          <option key={lora.id} value={lora.id}>
            {lora.title}
          </option>
        ))}
      </select>
      
      {/* Control de intensidad del LoRA */}
      <label>
        Intensidad LoRA: 
        <input 
          type="range" 
          name="lora_scale" 
          min="0.1" 
          max="1.5" 
          step="0.1" 
          defaultValue="0.75"
        />
        <span id="lora-value">0.75</span>
      </label>
      
      <input type="file" name="init_image_file" accept="image/*" />
      <button disabled={loading}>Generar</button>
      
      {loading && <p>Generando...</p>}
      {result && result.images && (
        result.images.map((img, i) => <img key={i} src={img} width={256} />)
      )}
      {result && result.error_code === 1 && <p>{result.message}</p>}
    </form>
  );
}
```


### API Route actualizada con soporte para LoRAs

```js
// app/api/sinkin/route.js
export async function POST(req) {
  const formData = await req.formData();
  
  const params = {};
  
  // Parámetros estándar
  for (const key of [
    'access_token', 'model_id', 'prompt', 'width', 'height', 
    'negative_prompt', 'steps', 'scale', 'num_images', 'seed', 
    'scheduler', 'version', 'controlnet', 'image_strength'
  ]) {
    const v = formData.get(key);
    if (v !== null && v !== undefined && v !== '') params[key] = v;
  }
  
  // ¡PARÁMETROS DE LORA!
  const loraId = formData.get('lora');
  const loraScale = formData.get('lora_scale');
  
  if (loraId && loraId !== '') {
    params.lora = loraId;
  }
  
  if (loraScale && loraScale !== '') {
    params.lora_scale = parseFloat(loraScale);
  }
  
  // Crear FormData para la petición
  const multipart = new FormData();
  
  for (const key in params) {
    multipart.append(key, params[key]);
  }
  
  // Agregar archivo si existe
  const imageFile = formData.get('init_image_file');
  if (imageFile && imageFile.size > 0) {
    multipart.append('init_image_file', imageFile, imageFile.name);
  }
  
  // Petición a SinkInAI
  const response = await fetch('https://sinkin.ai/api/inference', {
    method: 'POST',
    body: multipart
  });
  
  const data = await response.json();
  return Response.json(data);
}
```


## Consejos importantes sobre el uso de LoRAs

**Valores recomendados para `lora_scale`**:[^2_1][^2_2][^2_3]

- **0.1-0.4**: Efecto muy sutil del LoRA
- **0.5-0.8**: Efecto moderado (recomendado para la mayoría de casos)
- **0.9-1.2**: Efecto fuerte
- **1.3+**: Puede saturar demasiado la imagen

**Ejemplo de petición con LoRA**:

```js
const params = {
  'access_token': 'tu_token',
  'model_id': 'yBG2r9O', // majicMIX realistic
  'prompt': 'portrait of a woman',
  'lora': 'ID_DEL_LORA', // ID obtenido del endpoint /models
  'lora_scale': 0.75,
  'num_images': 1
};
```


## Archivo de ejemplo completo

Aquí tienes el código completo listo para usar con soporte para LoRAs:

Los LoRAs te permiten aplicar estilos específicos, personajes particulares o conceptos únicos que no están presentes en el modelo base, ofreciendo mucha más personalización en la generación de imágenes.[^2_4][^2_1][^2_5]
<span style="display:none">[^2_10][^2_11][^2_12][^2_13][^2_14][^2_15][^2_16][^2_17][^2_18][^2_19][^2_20][^2_21][^2_22][^2_23][^2_24][^2_25][^2_26][^2_27][^2_28][^2_29][^2_30][^2_31][^2_32][^2_33][^2_34][^2_35][^2_36][^2_6][^2_7][^2_8][^2_9]</span>

<div align="center">⁂</div>

[^2_1]: https://huggingface.co/docs/diffusers/v0.29.1/en/api/loaders/lora

[^2_2]: https://translate.google.com/translate?u=https%3A%2F%2Frunware.ai%2Fdocs%2Fen%2Fimage-inference%2Fapi-reference\&hl=es\&sl=en\&tl=es\&client=srp

[^2_3]: https://huggingface.co/spaces/lora-library/LoRA-DreamBooth-Training-UI/commit/4bd7dce3940833ff35526c715febf91c889ca488

[^2_4]: https://ai.google.dev/edge/mediapipe/solutions/vision/image_generator?hl=es-419

[^2_5]: https://www.ibm.com/docs/es/watsonx/w-and-w/2.1.0?topic=tuning-lora-fine

[^2_6]: https://www.youtube.com/watch?v=cJ8lfWP975c

[^2_7]: https://www.machinelearningmastery.com/fine-tuning-stable-diffusion-with-lora/

[^2_8]: https://www.youtube.com/watch?v=XZ0RRu8Np54

[^2_9]: https://datos.ninja/tutorial/guia-facil-flux-1-generar-imagenes-cara/

[^2_10]: https://stablediffusionapi.com/docs/train-model/lora-finetune/

[^2_11]: https://www.youtube.com/watch?v=COy72BRENso

[^2_12]: https://translate.google.com/translate?u=https%3A%2F%2Ffal.ai%2Fmodels%2Ffal-ai%2Fflux-lora%2Fapi\&hl=es\&sl=en\&tl=es\&client=srp

[^2_13]: https://www.youtube.com/watch?v=rQYJCV2VmNM

[^2_14]: https://translate.google.com/translate?u=https%3A%2F%2Fthepaulo.medium.com%2Fgenerate-photos-of-yourself-by-training-a-lora-for-stable-diffusion-privately-on-aws-124463750ff5\&hl=es\&sl=en\&tl=es\&client=srp

[^2_15]: https://github.com/bmaltais/kohya_ss/wiki/LoRA-training-parameters

[^2_16]: https://www.youtube.com/watch?v=nfBFNcFj_wQ

[^2_17]: https://translate.google.com/translate?u=https%3A%2F%2Fhuggingface.co%2Fdocs%2Fpeft%2Fmain%2Ftask_guides%2Fimage_classification_lora\&hl=es\&sl=en\&tl=es\&client=srp

[^2_18]: https://github.com/AUTOMATIC1111/stable-diffusion-webui/discussions/10468

[^2_19]: https://www.youtube.com/watch?v=v4w8hJ_7ktU

[^2_20]: https://stablediffusionapi.com/docs/

[^2_21]: https://translate.google.com/translate?u=https%3A%2F%2Fdata-ai.theodo.com%2Fen%2Ftechnical-blog%2Fgenerative-ai-image-generation-stable-diffusion\&hl=es\&sl=en\&tl=es\&client=srp

[^2_22]: https://www.reddit.com/r/StableDiffusion/comments/1djaz6y/create_lora_via_api/

[^2_23]: https://blog.cloudflare.com/es-es/fine-tuned-inference-with-loras/

[^2_24]: https://translate.google.com/translate?u=https%3A%2F%2Fabvijaykumar.medium.com%2Ffine-tuning-llm-parameter-efficient-fine-tuning-peft-lora-qlora-part-2-d8e23877ac6f\&hl=es\&sl=en\&tl=es\&client=srp

[^2_25]: https://www.arts.chula.ac.th/~sandbox/wp-content/uploads/mkpgxfq/lora-config-parameters-python.html

[^2_26]: https://civitai.com/models/69480/lora-training-guide-steal-parameters-metadata-greater-hiperparametros-less

[^2_27]: https://translate.google.com/translate?u=https%3A%2F%2Fgithub.com%2Fbmaltais%2Fkohya_ss%2Fwiki%2FLoRA-training-parameters\&hl=es\&sl=en\&tl=es\&client=srp

[^2_28]: https://translate.google.com/translate?u=https%3A%2F%2Flearn.microsoft.com%2Fen-us%2Fwindows%2Fai%2Fapis%2Fphi-silica-lora\&hl=es\&sl=en\&tl=es\&client=srp

[^2_29]: https://huggingface.co/diegochavez/lora-training/blob/ebdbee0f95d811e0b9b60cf439cffddfa0a2c232/README.md

[^2_30]: https://translate.google.com/translate?u=https%3A%2F%2Fneptune.ai%2Fblog%2Ffine-tuning-llama-3-with-lora\&hl=es\&sl=en\&tl=es\&client=srp

[^2_31]: https://huggingface.co/diegochavez/lora-training/blob/c15a068001cb7247cc5b30f8124f54314acc641f/README.md

[^2_32]: https://translate.google.com/translate?u=https%3A%2F%2Fhuggingface.co%2Fdocs%2Fdiffusers%2Fv0.22.0%2Ftraining%2Flora\&hl=es\&sl=en\&tl=es\&client=srp

[^2_33]: https://huggingface.co/diegochavez/lora-training/blob/29c87a99018f40a9b2ac48a75c32ffe69065d3d9/README.md

[^2_34]: https://translate.google.com/translate?u=https%3A%2F%2Fai.google.dev%2Fgemma%2Fdocs%2Fcore%2Flora_tuning\&hl=es\&sl=en\&tl=es\&client=srp

[^2_35]: https://huggingface.co/datasets/multimodalart/lora-fusing-preferences/commit/2ee2f194ca6e78e96f4b893f8317e4e695e63b57

[^2_36]: https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/ce4ebe5c0795593ce72bd7e7037ab23f/cbbc8c80-22fa-4f2c-aac5-2cb3b7ce20df/62b85726.md

