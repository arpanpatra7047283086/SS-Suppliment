'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const productSchema = z.object({ name: z.string().min(2), slug: z.string().min(2), category: z.string().min(2), description: z.string().min(5), price: z.coerce.number().nonnegative(), stock: z.coerce.number().int().nonnegative(), imageUrl: z.string().url().optional().or(z.literal('')) })
type ProductForm = z.infer<typeof productSchema>

export default function AdminPage() {
  const [message, setMessage] = useState(''); const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductForm>({ resolver: zodResolver(productSchema) })
  async function onSubmit(values: ProductForm) { const response = await fetch('/api/admin/products', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(values) }); setMessage(response.ok ? 'Product saved.' : 'Could not save product.'); if (response.ok) reset() }
  return <main className="admin-page"><div className="admin-panel"><div className="eyebrow dark"><span /> SS SUPPLEMENT / ADMIN</div><h1>Product workspace.</h1><p>Add and manage supplement catalog items securely.</p><form onSubmit={handleSubmit(onSubmit)} className="admin-form">{[['name','Product name'],['slug','Slug'],['category','Category'],['description','Description'],['price','Price'],['stock','Stock'],['imageUrl','Image URL']].map(([key,label]) => <label key={key}>{label}<input {...register(key as keyof ProductForm)} />{errors[key as keyof ProductForm] && <small>Required or invalid.</small>}</label>)}<button type="submit" className="primary-button">Save product</button></form>{message && <p role="status">{message}</p>}</div></main>
}
