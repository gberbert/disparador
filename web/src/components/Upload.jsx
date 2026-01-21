import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

export default function Upload() {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: '' }

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setProgress(0);
        setStatus(null);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsName = wb.SheetNames[0];
                const ws = wb.Sheets[wsName];
                const data = XLSX.utils.sheet_to_json(ws);

                await processImport(data);
                setStatus({ type: 'success', message: 'Importação realizada com sucesso!' });
            } catch (err) {
                console.error(err);
                setStatus({ type: 'error', message: 'Erro ao processar arquivo: ' + err.message });
            } finally {
                setLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const excelDateToJSDate = (serial) => {
        // Se for string já formatada (YYYY-MM-DD), retorna.
        if (typeof serial === 'string' && serial.match(/^\d{4}-\d{2}-\d{2}$/)) return serial;

        // Se for string DD/MM/YYYY
        if (typeof serial === 'string' && serial.includes('/')) {
            const [day, month, year] = serial.split('/');
            return `${year}-${month}-${day}`;
        }

        // Se for serial number do Excel
        if (typeof serial === 'number') {
            const utc_days = Math.floor(serial - 25569);
            const utc_value = utc_days * 86400;
            const date_info = new Date(utc_value * 1000);
            return date_info.toISOString().split('T')[0];
        }

        return serial; // Tenta passar como está se falhar
    };

    const processImport = async (rows) => {
        // Esperado: Nome, Whatsapp, Nascimento, Email, Empresa, Nome Supervisor, Whatsapp Supervisor, Email Supervisor

        let successCount = 0;
        let errors = [];
        const total = rows.length;

        for (const [index, row] of rows.entries()) {
            if (index % 5 === 0 || index === total - 1) setProgress(Math.round(((index + 1) / total) * 100));

            if (!row['Nome'] || !row['Whatsapp']) continue; // Skip empty rows

            try {
                // 1. Processar/Criar Supervisor
                // 1. Processar/Criar Supervisor (Upsert por Nome)
                let supervisorId = null;
                if (row['Nome Supervisor']) {
                    const { data: sup, error: supError } = await supabase
                        .from('supervisores')
                        .upsert({
                            nome: row['Nome Supervisor'],
                            whatsapp: row['Whatsapp Supervisor'] || '',
                            email: row['Email Supervisor'] || ''
                        }, { onConflict: 'nome' })
                        .select('id')
                        .single();

                    if (supError) throw new Error(`Erro ao processar supervisor ${row['Nome Supervisor']}: ${supError.message}`);
                    supervisorId = sup.id;
                }

                // 2. Criar Profissional
                let birthDate = excelDateToJSDate(row['Nascimento']);
                const cleanPhone = (phone) => String(phone).replace(/\D/g, '');

                const { error: prosError } = await supabase.from('profissionais').upsert({
                    nome: row['Nome'],
                    whatsapp: cleanPhone(row['Whatsapp']),
                    email: row['Email'],
                    data_nascimento: birthDate,
                    empresa: row['Empresa'],
                    supervisor_id: supervisorId
                }, { onConflict: 'nome' });

                if (prosError) throw new Error(`Erro ao salvar profissional ${row['Nome']}: ${prosError.message}`);

                successCount++;

            } catch (err) {
                console.error(err);
                errors.push(`Linha ${index + 2}: ${err.message}`);
            }
        }

        if (errors.length > 0) {
            throw new Error(`${errors.length} erros encontrados. Primeiros: ${errors.slice(0, 3).join('; ')}`);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = [
            ['Nome', 'Whatsapp', 'Nascimento', 'Email', 'Empresa', 'Nome Supervisor', 'Whatsapp Supervisor', 'Email Supervisor'],
            ['João Silva', '5511999999999', '1990-05-20', 'joao@email.com', 'Minha Empresa', 'Maria Gestora', '5511888888888', 'maria@email.com']
        ];

        const ws = XLSX.utils.aoa_to_sheet(headers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Modelo Importacao");
        XLSX.writeFile(wb, "modelo_importacao_rh.xlsx");
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto mt-10">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 =text-indigo-700">
                    <FileSpreadsheet className="w-6 h-6" /> Importar Dados
                </h2>
                <button
                    onClick={handleDownloadTemplate}
                    className="text-sm text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
                >
                    Baixar Modelo Exemplo
                </button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:bg-gray-50 transition-colors relative">
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    disabled={loading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center pointer-events-none">
                    <UploadIcon className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">Arraste ou clique para selecionar o Excel</p>
                    <p className="text-sm text-gray-400 mt-1">Colunas: Nome, Whatsapp, Nascimento, etc.</p>
                </div>
            </div>

            {loading && (
                <div className="mt-4 w-full bg-gray-200 rounded-full h-4 overflow-hidden relative">
                    <div
                        className="bg-indigo-600 h-full transition-all duration-300 ease-out flex items-center justify-end pr-2 text-xs text-white font-bold"
                        style={{ width: `${progress}%` }}
                    >
                        {progress > 10 && `${progress}%`}
                    </div>
                    {progress <= 10 && <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">{progress}%</span>}
                </div>
            )}

            {status && (
                <div className={`mt-4 p-4 rounded-md flex items-center gap-2 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {status.message}
                </div>
            )}
        </div>
    );
}
