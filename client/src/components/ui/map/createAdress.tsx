import React, { useState } from 'react';
import { toast } from 'sonner';
import { useCreateAddress } from '../../../hooks/useAddress'; 
import MapWithAddress from './mapWithAddress';
import { CreateAddressRequest } from '@/types/Address.type';

const CreateAddress: React.FC<{ userId: string }> = ({ userId }) => {
  const [address, setAddress] = useState<CreateAddressRequest>({
    name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_default: false,
    latitude: 0,
    longitude: 0,
    user_id: userId, 
  });

  const [coordinates, setCoordinates] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  });

  const { mutate: createAddress } = useCreateAddress(); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!coordinates.latitude || !coordinates.longitude) {
      toast.error('Vui lòng chọn vị trí trên bản đồ.');
      return;
    }

    
    createAddress({
      ...address,
      user_id: address.user_id, 
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    });

   
    toast.success('Địa chỉ đã được tạo thành công!');
  };

  return (
    <div>
      <h3>Thêm địa chỉ mới</h3>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" value={address.name} onChange={handleChange} required placeholder="Tên" />
        <input type="text" name="phone" value={address.phone} onChange={handleChange} required placeholder="Số điện thoại" />
        <input type="text" name="address_line1" value={address.address_line1} onChange={handleChange} required placeholder="Địa chỉ 1" />
        <input type="text" name="address_line2" value={address.address_line2} onChange={handleChange} placeholder="Địa chỉ 2" />
        <input type="text" name="city" value={address.city} onChange={handleChange} required placeholder="Thành phố" />
        <input type="text" name="state" value={address.state} onChange={handleChange} required placeholder="Tỉnh" />
        <input type="text" name="postal_code" value={address.postal_code} onChange={handleChange} required placeholder="Mã bưu điện" />
        <input type="text" name="country" value={address.country} onChange={handleChange} required placeholder="Quốc gia" />
        <MapWithAddress setCoordinates={setCoordinates} />
        <button type="submit">
          Tạo địa chỉ
        </button>
      </form>
    </div>
  );
};

export default CreateAddress;
