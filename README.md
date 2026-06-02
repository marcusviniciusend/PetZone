# PetZone

Aplicativo mobile de conexão entre tutores de pets — encontre companheiros para passeios, brincadeiras e muito mais. Funciona como um swipe de cards estilo Tinder, mas para pets e seus donos.

Desenvolvido com React Native + Expo, backend Supabase e suporte a múltiplos idiomas (Português e Inglês).

---

## Funcionalidades

- **Swipe de pets** — deslize para curtir ou ignorar pets próximos
- **Filtros de busca** — filtre por espécie, raça, idade e distância (geolocalização)
- **Matches** — quando dois tutores curtem os pets um do outro, um match é criado
- **Chat em tempo real** — converse com tutores dos seus matches via Supabase Realtime
- **Perfil do tutor** — nome, bio e foto
- **Cadastro de pets** — múltiplos pets por tutor, com foto, espécie, raça, idade e bio
- **Carteirinha de vacinação** — upload de documento e selo de pet verificado
- **Internacionalização** — interface em Português (pt-BR) e Inglês (en-US) com persistência da escolha
- **LGPD** — consentimento, exportação e exclusão de dados

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Mobile | React Native 0.79 + Expo 53 |
| Linguagem | TypeScript 5.8 |
| Navegação | React Navigation 6 (stack + bottom tabs) |
| Estado global | Zustand 5 |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Internacionalização | i18next + react-i18next |
| Ícones | react-native-vector-icons (Ionicons + MaterialCommunityIcons) |
| Imagens | expo-image, expo-image-picker |
| Geolocalização | expo-location |
| Persistência local | AsyncStorage |

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) **>= 20.0.0**
- [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/client) no dispositivo físico **ou** um emulador Android/iOS configurado
- Uma conta no [Supabase](https://supabase.com/) com projeto criado

---

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/marcusviniciusend/PetZone.git
cd PetZone
```

### 2. Instale as dependências

```bash
yarn install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as credenciais do seu projeto Supabase:

```env
SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

> **Onde encontrar essas chaves:**
> Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard) → **Settings** → **API**.
> Copie a **Project URL** e a **anon/public key**.

---

## Execução

### Expo Go (recomendado para desenvolvimento)

```bash
npx expo start
```

Após iniciar, escaneie o QR Code com o app **Expo Go** no seu celular (Android ou iOS).

### Android (emulador ou dispositivo USB)

```bash
yarn android
# ou
npx expo run:android
```

### iOS (apenas macOS, requer Xcode)

```bash
yarn ios
# ou
npx expo run:ios
```

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `yarn start` | Inicia o Metro Bundler |
| `yarn android` | Builda e executa no Android |
| `yarn ios` | Builda e executa no iOS |
| `yarn lint` | Executa o ESLint |
| `yarn test` | Executa os testes com Jest |

---

## Estrutura do Projeto

```
petzone/
├── assets/                    # Ícones e splash screen
├── src/
│   ├── components/            # Componentes reutilizáveis
│   │   ├── CustomInput.tsx    # Input com estados visuais (default/focus/error/success)
│   │   ├── PetCard.tsx        # Card de pet para o swipe
│   │   ├── MatchModal.tsx     # Modal de novo match
│   │   ├── ChatBubble.tsx     # Bolha de mensagem
│   │   ├── DistanceFilter.tsx
│   │   ├── LanguageSelector.tsx
│   │   └── LGPDConsent.tsx
│   ├── constants/
│   │   └── petSpecies.ts      # Lista de espécies suportadas
│   ├── hooks/
│   │   ├── useSwipe.ts
│   │   ├── useMatches.ts
│   │   └── useChat.ts
│   ├── i18n/                  # Internacionalização
│   │   ├── index.ts
│   │   ├── pt-BR.ts
│   │   └── en-US.ts
│   ├── lib/
│   │   └── supabase.ts        # Cliente Supabase
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── profile/
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── EditProfileScreen.tsx
│   │   │   ├── AddPetScreen.tsx
│   │   │   └── EditPetScreen.tsx
│   │   └── social/
│   │       ├── SwipeScreen.tsx
│   │       ├── MatchesScreen.tsx
│   │       └── ChatScreen.tsx
│   ├── services/              # Camada de acesso ao Supabase
│   │   ├── authService.ts
│   │   ├── chatService.ts
│   │   ├── imageService.ts
│   │   ├── locationService.ts
│   │   ├── matchService.ts
│   │   ├── petService.ts
│   │   └── profileService.ts
│   ├── stores/                # Estado global (Zustand)
│   │   ├── authStore.ts
│   │   ├── activePetStore.ts
│   │   ├── chatStore.ts
│   │   └── swipeStore.ts
│   ├── theme/
│   │   └── colors.ts
│   ├── types/
│   │   └── env.d.ts
│   └── utils/
│       ├── lgpd.ts
│       ├── notifications.ts
│       └── responsive.ts
├── App.tsx                    # Raiz da aplicação e navegação
├── app.json                   # Configuração Expo
├── package.json
└── tsconfig.json
```

---

## Geolocalização

O PetZone usa `expo-location` para descobrir pets próximos ao usuário.

### Como funciona

1. **Permissão em tempo de execução** — ao abrir o swipe, o app solicita permissão de localização em primeiro plano (`requestForegroundPermissionsAsync`). Se negada, a busca cai no modo sem filtro de distância.
2. **Coordenadas salvas no Supabase** — latitude, longitude e `location_updated_at` são gravados na tabela `profiles` a cada sessão.
3. **Busca por proximidade** — os pets são listados via função RPC `get_nearby_pets` (PostGIS ou cálculo de Haversine no banco), recebendo a posição do usuário e o raio máximo em km.
4. **Cálculo de distância no cliente** — `locationService.calculateDistance()` usa a fórmula de Haversine para exibir a distância no card de cada pet.

### Configuração necessária no Supabase

Adicione as colunas à tabela `profiles`:

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ;
```

Crie a função RPC usada pelo `locationService.getNearbyPets()`:

```sql
CREATE OR REPLACE FUNCTION get_nearby_pets(
  user_lat        DOUBLE PRECISION,
  user_lon        DOUBLE PRECISION,
  max_distance    DOUBLE PRECISION,  -- km
  current_user_id UUID,
  my_pet_uuid     UUID
)
RETURNS TABLE (...) -- ajuste as colunas conforme seu schema
LANGUAGE sql
AS $$
  SELECT p.*, (
    6371 * acos(
      cos(radians(user_lat)) * cos(radians(pr.latitude)) *
      cos(radians(pr.longitude) - radians(user_lon)) +
      sin(radians(user_lat)) * sin(radians(pr.latitude))
    )
  ) AS distance_km
  FROM pets p
  JOIN profiles pr ON pr.id = p.owner_id
  WHERE pr.id <> current_user_id
    AND p.id <> my_pet_uuid
  HAVING distance_km <= max_distance
  ORDER BY distance_km;
$$;
```

> Se o usuário negar a permissão ou não tiver coordenadas salvas, o app exibe todos os pets disponíveis sem filtro de distância.

---

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase |

> O arquivo `.env` nunca deve ser commitado. Ele já está listado no `.gitignore`.

---

## Licença

Este projeto foi desenvolvido como projeto de extensão universitária no **iCEV**.
.
