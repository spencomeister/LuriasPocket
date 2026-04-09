-- CreateIndex
CREATE INDEX "Character_element_rarity_idx" ON "Character"("element", "rarity");

-- CreateIndex
CREATE INDEX "Character_category_idx" ON "Character"("category");

-- CreateIndex
CREATE INDEX "Character_series_idx" ON "Character"("series");

-- CreateIndex
CREATE INDEX "Character_releaseDate_idx" ON "Character"("releaseDate");

-- CreateIndex
CREATE INDEX "Summon_element_category_rarity_idx" ON "Summon"("element", "category", "rarity");

-- CreateIndex
CREATE INDEX "Summon_name_idx" ON "Summon"("name");

-- CreateIndex
CREATE INDEX "Weapon_element_weaponType_category_rarity_idx" ON "Weapon"("element", "weaponType", "category", "rarity");

-- CreateIndex
CREATE INDEX "Weapon_name_idx" ON "Weapon"("name");
