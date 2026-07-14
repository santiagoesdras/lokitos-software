import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const handleSubmit = async (e)=>{
    e.preventDefault()
    setError(null)
    const { error } = await signIn(email, password)
    if(error){
      setError(error.message)
      return
    }
    navigate('/')
  }

  return (
    <div className="panel" style={{maxWidth:420, margin:'24px auto'}}>
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit}>
        <div style={{marginBottom:12}}>
          <label>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={{width:'100%',padding:8}} />
        </div>
        <div style={{marginBottom:12}}>
          <label>Contraseña</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required style={{width:'100%',padding:8}} />
        </div>
        {error && <div style={{color:'red',marginBottom:12}}>{error}</div>}
        <button type="submit" style={{background:'var(--accent)',color:'#fff',padding:'8px 16px',border:'none',borderRadius:6}}>Entrar</button>
      </form>
    </div>
  )
}
