export default function Field({type,placeholder,value,onChange,name}){
    return (
        <>
        <input type={type} placeholder={placeholder} value={value} onChange={onChange} name={name}/>
        <br /><br />
        </>
    )
}