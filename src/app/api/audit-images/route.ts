/**
 * API Endpoint: Audit et mise a jour des images produits
 * GET /api/audit-images - Recupere les images CJ et genere un rapport
 * POST /api/audit-images - Met a jour products.json avec les vraies images CJ
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenByApiKey, getProductById, PRODUCT_CJ_MAPPING } from '@/lib/cj-client'
import * as fs from 'fs'
import * as path from 'path'

interface CJProductData {
  pid: string
  productName: string
  productNameEn: string
  productImage: string
  productImageSet?: string[]
  variants?: Array<{
    vid: string
    variantName: string
    variantNameEn: string
    variantImage?: string
  }>
}

interface AuditResult {
  productId: string
  productName: string
  currentImages: string[]
  cjProductId: string | null
  cjImages: string[]
  status: 'updated' | 'pending_cj' | 'no_cj_images' | 'error'
  message: string
}

// Chemin vers products.json
const PRODUCTS_FILE = path.join(process.cwd(), 'src/data/products.json')

export async function GET() {
  console.log('=== AUDIT IMAGES PRODUITS ===')

  const auditResults: AuditResult[] = []

  try {
    // Lire products.json
    const productsData = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'))

    // Obtenir le token CJ
    console.log('1. Authentification CJ...')
    const token = await getAccessTokenByApiKey()
    console.log('   Token obtenu!')

    // Pour chaque produit, verifier le mapping CJ
    console.log('\n2. Verification des produits...')

    for (const product of productsData) {
      const mapping = PRODUCT_CJ_MAPPING[product.id]

      const result: AuditResult = {
        productId: product.id,
        productName: product.name,
        currentImages: product.images || [product.image],
        cjProductId: null,
        cjImages: [],
        status: 'pending_cj',
        message: ''
      }

      if (!mapping || mapping.vid === 'PENDING_CJ_SEARCH') {
        result.status = 'pending_cj'
        result.message = 'Produit non configure dans CJ - images Unsplash conservees'
        console.log(`   [PENDING] ${product.id}: Pas de mapping CJ`)
      } else {
        result.cjProductId = mapping.cjProductId

        try {
          // Appeler l'API CJ pour obtenir les details du produit
          console.log(`   [FETCH] ${product.id}: Recuperation depuis CJ (PID: ${mapping.cjProductId})`)

          const cjResponse = await getProductById(mapping.cjProductId)

          if (cjResponse.result && cjResponse.data) {
            const cjProduct: CJProductData = cjResponse.data

            // Collecter toutes les images CJ
            const cjImages: string[] = []

            // Image principale
            if (cjProduct.productImage) {
              cjImages.push(cjProduct.productImage)
            }

            // Set d'images supplementaires
            if (cjProduct.productImageSet && cjProduct.productImageSet.length > 0) {
              cjImages.push(...cjProduct.productImageSet)
            }

            // Images des variantes
            if (cjProduct.variants) {
              for (const variant of cjProduct.variants) {
                if (variant.variantImage && !cjImages.includes(variant.variantImage)) {
                  cjImages.push(variant.variantImage)
                }
              }
            }

            result.cjImages = cjImages

            if (cjImages.length > 0) {
              result.status = 'updated'
              result.message = `${cjImages.length} images CJ trouvees`
              console.log(`   [OK] ${product.id}: ${cjImages.length} images CJ`)
            } else {
              result.status = 'no_cj_images'
              result.message = 'Produit CJ trouve mais sans images'
              console.log(`   [WARN] ${product.id}: Pas d'images dans CJ`)
            }
          } else {
            result.status = 'error'
            result.message = cjResponse.message || 'Erreur API CJ'
            console.log(`   [ERROR] ${product.id}: ${result.message}`)
          }
        } catch (error) {
          result.status = 'error'
          result.message = error instanceof Error ? error.message : 'Erreur inconnue'
          console.log(`   [ERROR] ${product.id}: ${result.message}`)
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      auditResults.push(result)
    }

    // Generer le rapport
    const summary = {
      total: auditResults.length,
      updated: auditResults.filter(r => r.status === 'updated').length,
      pending: auditResults.filter(r => r.status === 'pending_cj').length,
      noImages: auditResults.filter(r => r.status === 'no_cj_images').length,
      errors: auditResults.filter(r => r.status === 'error').length
    }

    console.log('\n=== RAPPORT AUDIT ===')
    console.log(`Total: ${summary.total} produits`)
    console.log(`Avec images CJ: ${summary.updated}`)
    console.log(`En attente CJ: ${summary.pending}`)
    console.log(`Sans images CJ: ${summary.noImages}`)
    console.log(`Erreurs: ${summary.errors}`)

    return NextResponse.json({
      success: true,
      summary,
      details: auditResults,
      instruction: 'Utilisez POST /api/audit-images pour appliquer les changements'
    })

  } catch (error) {
    console.error('Erreur audit:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log('=== MISE A JOUR IMAGES PRODUITS ===')

  try {
    // D'abord, faire l'audit
    const auditResponse = await GET()
    const auditData = await auditResponse.json()

    if (!auditData.success) {
      return NextResponse.json(auditData, { status: 500 })
    }

    // Lire products.json
    const productsData = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'))

    // Backup avant modification
    const backupPath = PRODUCTS_FILE.replace('.json', `.backup-${Date.now()}.json`)
    fs.writeFileSync(backupPath, JSON.stringify(productsData, null, 2))
    console.log(`Backup cree: ${backupPath}`)

    // Appliquer les mises a jour
    const changes: string[] = []

    for (const result of auditData.details as AuditResult[]) {
      if (result.status === 'updated' && result.cjImages.length > 0) {
        // Trouver le produit dans le tableau
        const productIndex = productsData.findIndex((p: any) => p.id === result.productId)

        if (productIndex !== -1) {
          // Garder les 4 premieres images CJ
          const newImages = result.cjImages.slice(0, 4)

          productsData[productIndex].image = newImages[0]
          productsData[productIndex].images = newImages

          changes.push(`${result.productId}: ${newImages.length} images CJ appliquees`)
          console.log(`[UPDATED] ${result.productId}`)
        }
      }
    }

    // Sauvegarder products.json
    if (changes.length > 0) {
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(productsData, null, 2))
      console.log(`\nproducts.json mis a jour avec ${changes.length} changements`)
    }

    return NextResponse.json({
      success: true,
      message: `${changes.length} produits mis a jour`,
      backup: backupPath,
      changes,
      unchanged: auditData.details.filter((r: AuditResult) => r.status !== 'updated').map((r: AuditResult) => ({
        id: r.productId,
        reason: r.message
      }))
    })

  } catch (error) {
    console.error('Erreur mise a jour:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
