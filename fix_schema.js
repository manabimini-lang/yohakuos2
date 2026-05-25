const fs = require('fs');
let schema = fs.readFileSync('/Users/matsumotoyouhei/Documents/YOHAKUOS2/prisma/schema.prisma', 'utf8');

// Remove the appended Memory Layer section completely
const memoryLayerStart = schema.indexOf('// ===================================================\n// YOHAKU Personal Knowledge Memory Layer');
if (memoryLayerStart !== -1) {
    schema = schema.substring(0, memoryLayerStart);
}

// Remove the AI fields added to Reflection
schema = schema.replace(/\/\/ AI Memory Fields[\s\S]+?createdAt      DateTime/, 'createdAt      DateTime');

// Add the exact original schema at the end
schema += `
// ===================================================
// YOHAKU Personal Knowledge Memory Layer
// ===================================================

enum KnowledgeCardType {
  url
  text
  youtube
  pdf
  voice
  web_clipping
  ai_conversation
  reflection
}

model KnowledgeCard {
  id        String            @id @default(cuid())
  userId    String            @map("user_id")
  type      KnowledgeCardType
  source    String?           // 元URL、ファイルパスなど
  title     String?
  content   String            @db.Text
  metadata  Json?             @db.JsonB

  summary   String?           @db.Text
  tags      String[]

  userMemories UserMemory[]
  memorySources MemorySource[]

  createdAt DateTime          @default(now()) @map("created_at")
  updatedAt DateTime          @updatedAt @map("updated_at")

  user      User              @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, type])
  @@index([userId, createdAt])
  @@map("knowledge_cards")
}

enum MemoryType {
  value
  belief
  goal
  fear
  motivation
  learning_style
  habit
  personality_trait
  reflection
  emotional_pattern
  life_theme
  behavior_pattern
  thinking_pattern
}

model UserMemory {
  id          String     @id @default(cuid())
  userId      String     @map("user_id")
  type        MemoryType
  category    String?    
  title       String
  content     String     @db.Text
  confidence  Float      @default(0.5)

  fingerprint String?    @unique
  version     Int        @default(1)
  supersededId String?   @map("superseded_id")

  outgoingEdges MemoryGraphEdge[] @relation("OutgoingEdges")
  incomingEdges MemoryGraphEdge[] @relation("IncomingEdges")

  sourceCard   KnowledgeCard? @relation(fields: [sourceCardId], references: [id], onDelete: SetNull)
  sourceCardId String?        @map("source_card_id")
  sources      MemorySource[]

  promptVersion String?       @map("prompt_version")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, type])
  @@index([userId, confidence])
  @@index([userId, type, confidence])
  @@index([fingerprint])
  @@map("user_memories")
}

enum EdgeRelation {
  supports
  contradicts
  causes
  results_in
  similar_to
  evolved_to
  influenced_by
}

model MemoryGraphEdge {
  id           String       @id @default(cuid())
  fromMemoryId String       @map("from_memory_id")
  toMemoryId   String       @map("to_memory_id")
  relation     EdgeRelation
  strength     Float        @default(0.5)
  userId       String       @map("user_id")

  fromMemory   UserMemory   @relation("OutgoingEdges", fields: [fromMemoryId], references: [id], onDelete: Cascade)
  toMemory     UserMemory   @relation("IncomingEdges", fields: [toMemoryId], references: [id], onDelete: Cascade)

  createdAt    DateTime     @default(now()) @map("created_at")

  @@unique([fromMemoryId, toMemoryId, relation])
  @@index([userId])
  @@index([fromMemoryId])
  @@index([toMemoryId])
  @@map("memory_graph_edges")
}

model IdentitySnapshot {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  period    String   
  label     String   
  summary   String   @db.Text
  traits    Json     @db.JsonB 

  startDate DateTime @map("start_date")
  endDate   DateTime? @map("end_date")

  createdAt DateTime @default(now()) @map("created_at")

  @@index([userId, period])
  @@index([userId, startDate])
  @@map("identity_snapshots")
}

model MemorySource {
  id       String @id @default(cuid())
  memoryId String @map("memory_id")
  cardId   String @map("card_id")

  memory   UserMemory   @relation(fields: [memoryId], references: [id], onDelete: Cascade)
  card     KnowledgeCard @relation(fields: [cardId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now()) @map("created_at")

  @@unique([memoryId, cardId])
  @@index([cardId])
  @@index([memoryId])
  @@map("memory_sources")
}

enum JobStatus {
  pending
  processing
  completed
  failed
  deduped
}

model AIJob {
  id           String    @id @default(cuid())
  userId       String    @map("user_id")
  jobType      String    @map("job_type")
  status       JobStatus @default(pending)
  priority     Int       @default(0)

  input        Json      @db.JsonB
  output       Json?     @db.JsonB

  error        String?   @db.Text
  retryCount   Int       @default(0) @map("retry_count")
  maxRetries   Int       @default(3) @map("max_retries")

  tokenUsed    Int?      @map("token_used")
  costEstimate Float?    @map("cost_estimate")

  createdAt    DateTime  @default(now()) @map("created_at")
  startedAt    DateTime? @map("started_at")
  completedAt  DateTime? @map("completed_at")

  @@index([userId, status])
  @@index([status, priority, createdAt])
  @@index([status, createdAt])
  @@map("ai_jobs")
}
`;

// Also manually add fields to Reflection
schema = schema.replace('reflectionText String   @db.Text @map("reflection_text")', 
`reflectionText String   @db.Text @map("reflection_text")
  title         String?
  content       String?  @db.Text
  type          String?
  triggeredBy   String[]
  sentiment     String?
  confidence    Float    @default(0.7)
  promptVersion String?  @map("prompt_version")`);

fs.writeFileSync('/Users/matsumotoyouhei/Documents/YOHAKUOS2/prisma/schema.prisma', schema);
console.log('Schema fixed');
