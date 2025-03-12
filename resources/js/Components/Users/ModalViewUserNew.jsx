import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EyeOutlined } from '@ant-design/icons';
import { roleDisplayNames } from '@/Utils/constants';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { countries } from '@/Utils/countries.json';
import {
    MultiSelector,
    MultiSelectorContent,
    MultiSelectorInput,
    MultiSelectorItem,
    MultiSelectorList,
    MultiSelectorTrigger,
} from '@/components/ui/multi-select';
// Base schema for common fields
const baseUserSchema = {
    username: z
        .string()
        .min(1, 'El nombre de usuario es requerido')
        .max(15, 'Máximo 15 caracteres'),
    password: z.string().max(20, 'Máximo 20 caracteres').optional(),
    email: z.string().email('Correo electrónico inválido').optional(),
    status_id: z.string().min(1, 'El estado es requerido'),
    role: z.string().min(1, 'El rol es requerido'),
    branch_id: z.string().min(1, 'La sucursal es requerida').optional(),
};

// Schema for super-admin
const superAdminSchema = z.object({
    ...baseUserSchema,
});

// Schema for admin
const adminSchema = z.object({
    ...baseUserSchema,
    email: z
        .string()
        .email('Correo electrónico inválido')
        .min(1, 'El correo electrónico es requerido'),
    branch_id: z.string().min(1, 'La sucursal es requerida'),
});

// Schema for supervisor
const supervisorSchema = z.object({
    ...baseUserSchema,
    email: z
        .string()
        .email('Correo electrónico inválido')
        .min(1, 'El correo electrónico es requerido'),
    branch_id: z.string().min(1, 'La sucursal es requerida'),
});

// Schema for trabajador
const trabajadorSchema = z.object({
    ...baseUserSchema,
    first_name: z.string().min(1, 'El primer nombre es requerido').max(20),
    second_name: z.string().max(20).optional(),
    first_last_name: z
        .string()
        .min(1, 'El primer apellido es requerido')
        .max(20),
    second_last_name: z.string().max(20).optional(),
    phone: z.string().min(1, 'El teléfono es requerido').max(10),
    prefix: z.string().default('+56'),
    rutNumbers: z.string().min(1, 'El RUT es requerido').max(10),
    rutDv: z.string().min(1, 'El dígito verificador es requerido').max(1),
    birth_date: z.string().min(1, 'La fecha de nacimiento es requerida'),
    entry_date: z.string().optional(),
    nationality: z.string().min(1, 'La nacionalidad es requerida'),
    address: z.string().min(1, 'La dirección es requerida').max(100),
    marital_status: z.string().min(1, 'El estado civil es requerido'),
    pension: z.string().min(1, 'La previsión es requerida').max(20),
    health: z.string().min(1, 'La salud es requerida').max(20),
    afp: z.string().min(1, 'La AFP es requerida').max(20),
    childrens: z.string().min(1, 'El número de hijos es requerido').max(2),
});

// Schema for jugador
const jugadorSchema = z.object({
    first_name: z
        .string()
        .min(1, 'El primer nombre es requerido')
        .max(20, 'Máximo 20 caracteres'),
    second_name: z.string().max(20, 'Máximo 20 caracteres').optional(),
    first_last_name: z
        .string()
        .min(1, 'El primer apellido es requerido')
        .max(20, 'Máximo 20 caracteres'),
    second_last_name: z.string().max(20, 'Máximo 20 caracteres').optional(),
    phone: z
        .string()
        .min(1, 'El número de teléfono es requerido')
        .max(10, 'Máximo 10 caracteres'),
    rutNumbers: z
        .string()
        .min(1, 'Los números del RUT son requeridos')
        .max(10, 'Máximo 10 caracteres'),
    rutDv: z
        .string()
        .min(1, 'El código de verificación es requerido')
        .max(1, 'Máximo 1 caracter'),
    birth_date: z.string().min(1, 'La fecha de nacimiento es requerida'),
    email: z
        .string()
        .min(1, 'El correo electrónico es requerido')
        .email('Correo electrónico inválido')
        .max(60, 'Máximo 60 caracteres'),
    nationality: z.string().min(1, 'La nacionalidad es requerida'),
    address: z
        .string()
        .min(1, 'La dirección es requerida')
        .max(100, 'Máximo 100 caracteres'),
    branches: z
        .array(z.number())
        .min(1, 'Debe seleccionar al menos una sucursal'),
    categories: z
        .array(z.number())
        .min(1, 'Debe seleccionar al menos una categoría'),
});

const schemasByUserType = {
    'super-admin': superAdminSchema,
    admin: adminSchema,
    supervisor: supervisorSchema,
    trabajador: trabajadorSchema,
    jugador: jugadorSchema,
};

export default function ModalViewUser({
    data,
    statuses,
    roles,
    branches,
    userType,
    categories,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [initialValues, setInitialValues] = useState(null);

    const form = useForm({
        resolver: zodResolver(schemasByUserType[userType.toLowerCase()]),
        defaultValues: {
            username: data?.username || '',
            email: data?.email || '',
            status_id: data?.status_id?.toString() || '',
            role: data?.role?.name || '',
            branch_id: data?.branch_id?.toString() || '',
            phone: data?.phone || '',
            prefix: data?.prefix || '+56',
            // Trabajador & Jugador fields
            first_name: data?.first_name || '',
            second_name: data?.second_name || '',
            first_last_name: data?.first_last_name || '',
            second_last_name: data?.second_last_name || '',
            rutNumbers: data?.rutNumbers || '',
            rutDv: data?.rutDv || '',
            birth_date: data?.birth_date || '',
            entry_date: data?.entry_date || '',
            nationality: data?.nationality || 'Chile',
            address: data?.address || '',
            marital_status: data?.marital_status || '',
            pension: data?.pension || '',
            health: data?.health || '',
            afp: data?.afp || '',
            childrens: data?.childrens || '',
            branches: data?.branches || [],
            categories: data?.categories || [],
        },
    });

    useEffect(() => {
        if (isOpen) {
            setInitialValues(form.getValues());
        }
    }, [isOpen]);

    const hasChanges = () => {
        if (!initialValues) return false;
        const currentValues = form.getValues();
        return Object.keys(currentValues).some((key) => {
            return (
                JSON.stringify(currentValues[key]) !==
                JSON.stringify(initialValues[key])
            );
        });
    };

    const handleCloseAttempt = () => {
        if (hasChanges()) {
            setShowConfirmDialog(true);
        } else {
            setIsOpen(false);
        }
    };

    const handleConfirmClose = () => {
        setShowConfirmDialog(false);
        setIsOpen(false);
        form.reset(initialValues);
    };

    const onSubmit = (values) => {
        // Add your submit logic here
        setInitialValues(values);
        setIsOpen(false);
    };

    const formFieldsByUserType = {
        'super-admin': (
            <>
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre de usuario</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={15} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    {...field}
                                    maxLength={20}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="status_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione el estado" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {statuses?.map((status) => (
                                        <SelectItem
                                            key={status.id}
                                            value={status.id.toString()}
                                        >
                                            {status.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Rol</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione el rol" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {roles?.map((role) => (
                                        <SelectItem
                                            key={role?.id}
                                            value={role?.name}
                                        >
                                            {roleDisplayNames[role?.name]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </>
        ),
        admin: (
            <>
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre de usuario</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={15} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    {...field}
                                    maxLength={20}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Correo Electrónico</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={60} type="email" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="branch_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sucursal</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione la sucursal" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {branches?.map((branch) => (
                                        <SelectItem
                                            key={branch.id}
                                            value={branch.id.toString()}
                                        >
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="status_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione el estado" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {statuses?.map((status) => (
                                        <SelectItem
                                            key={status.id}
                                            value={status.id.toString()}
                                        >
                                            {status.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Rol</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione el rol" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {roles?.map((role) => (
                                        <SelectItem
                                            key={role?.id}
                                            value={role?.name}
                                        >
                                            {roleDisplayNames[role?.name]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </>
        ),
        supervisor: (
            <>
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre de usuario</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={15} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    {...field}
                                    maxLength={20}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Correo Electrónico</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={60} type="email" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="branch_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sucursal</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione la sucursal" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {branches?.map((branch) => (
                                        <SelectItem
                                            key={branch.id}
                                            value={branch.id.toString()}
                                        >
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </>
        ),
        trabajador: (
            <>
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre de usuario</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={15} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    {...field}
                                    maxLength={20}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Correo Electrónico</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={60} type="email" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="branch_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sucursal</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione la sucursal" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {branches?.map((branch) => (
                                        <SelectItem
                                            key={branch.id}
                                            value={branch.id.toString()}
                                        >
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Primer nombre</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={20} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="second_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Segundo nombre</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={20} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="first_last_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Primer apellido</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={20} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="second_last_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Segundo apellido</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={20} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="rutNumbers"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>RUT</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={10} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="rutDv"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Dígito verificador</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={1} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="birth_date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fecha de nacimiento</FormLabel>
                            <FormControl>
                                <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="entry_date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fecha de ingreso</FormLabel>
                            <FormControl>
                                <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nacionalidad</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={20} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Dirección</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={100} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="marital_status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estado civil</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={20} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="pension"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Previsión</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={20} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="health"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Salud</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={20} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="afp"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>AFP</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={20} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="childrens"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Número de hijos</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={2} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </>
        ),
        jugador: (
            <>
                <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Primer Nombre</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={20} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="second_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Segundo Nombre</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={20} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="first_last_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Primer Apellido</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={20} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="second_last_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Segundo Apellido</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={20} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Número de teléfono</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    maxLength={10}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(
                                            /\D/g,
                                            ''
                                        );
                                        field.onChange(value);
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-3 relative">
                    <FormField
                        control={form.control}
                        name="rutNumbers"
                        render={({ field }) => (
                            <FormItem className="w-10/12">
                                <FormLabel>Números del RUT</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        maxLength={10}
                                        onChange={(e) => {
                                            const value =
                                                e.target.value.replace(
                                                    /\D/g,
                                                    ''
                                                );
                                            field.onChange(value);
                                            validateRut(
                                                value,
                                                form.getFieldValue('rutDv')
                                            );
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <span className="my-auto font-bold mt-8">-</span>
                    <FormField
                        control={form.control}
                        name="rutDv"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cod. Verificación</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        maxLength={1}
                                        className="w-16"
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            field.onChange(value);
                                            validateRut(
                                                form.getFieldValue(
                                                    'rutNumbers'
                                                ),
                                                value
                                            );
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="birth_date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fecha de Nacimiento</FormLabel>
                            <FormControl>
                                <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Correo Electrónico</FormLabel>
                            <FormControl>
                                <Input {...field} type="email" maxLength={60} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nacionalidad</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione su nacionalidad" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {countries.map((country) => (
                                        <SelectItem
                                            key={country.name}
                                            value={country.name}
                                        >
                                            {country.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Dirección</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    maxLength={100}
                                    placeholder="Ciudad, calle, numero y ETC."
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="branches"
                    render={({ field }) => {
                        const selectedBranches =
                            field.value
                                ?.map(
                                    (id) =>
                                        branches?.find((b) => b.id === id)?.name
                                )
                                .filter(Boolean) || [];

                        return (
                            <FormItem>
                                <FormLabel>Sucursales</FormLabel>
                                <FormControl>
                                    <MultiSelector
                                        values={selectedBranches}
                                        onValuesChange={(newValues) => {
                                            const newIds = newValues
                                                .map(
                                                    (name) =>
                                                        branches?.find(
                                                            (b) =>
                                                                b.name === name
                                                        )?.id
                                                )
                                                .filter(Boolean);
                                            field.onChange(newIds);
                                        }}
                                        loop
                                        className="max-w-[400px]"
                                    >
                                        <MultiSelectorTrigger className="w-full">
                                            <MultiSelectorInput placeholder="Seleccionar sucursales..." />
                                        </MultiSelectorTrigger>
                                        <MultiSelectorContent>
                                            <MultiSelectorList>
                                                {branches?.map((branch) => (
                                                    <MultiSelectorItem
                                                        key={branch.id}
                                                        value={branch.name}
                                                    >
                                                        {branch.name}
                                                    </MultiSelectorItem>
                                                ))}
                                            </MultiSelectorList>
                                        </MultiSelectorContent>
                                    </MultiSelector>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        );
                    }}
                />

                <FormField
                    control={form.control}
                    name="categories"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categoría</FormLabel>
                            <Select
                                onValueChange={(value) =>
                                    field.onChange(parseInt(value))
                                }
                                defaultValue={field.value?.toString()}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar categoría" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categories?.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={category.id.toString()}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </>
        ),
    };

    return (
        <>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        className="flex items-center gap-2 p-2 hover:bg-accent"
                        onClick={() => setIsOpen(true)}
                    >
                        <EyeOutlined className="h-4 w-4" />
                        <span>Ver detalles</span>
                    </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:min-w-[700px]">
                    <SheetHeader>
                        <SheetTitle>Ver Usuario</SheetTitle>
                        <SheetDescription>
                            Visualiza y edita la información del usuario
                        </SheetDescription>
                    </SheetHeader>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4 py-4"
                        >
                            <div className="h-[calc(100vh-200px)] p-2 overflow-y-auto">
                                {formFieldsByUserType[userType.toLowerCase()]}
                            </div>
                            <SheetFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCloseAttempt}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit">Guardar cambios</Button>
                            </SheetFooter>
                        </form>
                    </Form>
                </SheetContent>
            </Sheet>

            <Dialog
                open={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Estás seguro?</DialogTitle>
                        <DialogDescription>
                            Hay cambios sin guardar. ¿Estás seguro de que
                            quieres cerrar?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowConfirmDialog(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmClose}
                        >
                            Cerrar sin guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
